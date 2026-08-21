<?php

namespace Tests\Feature\PaymentPage;

use App\Actions\Financial\GetPaymentGatewayBalancesAction;
use App\Actions\Financial\ReconcileGatewayFeesAction;
use App\Models\GatewayBalanceSnapshot;
use App\Models\Payment;
use App\Models\PaymentChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ReconcileGatewayFeesTest extends TestCase
{
    use RefreshDatabase;

    private function fakeBalance(array ...$values): void
    {
        // Each execute() of the reconcile action calls the balance action once.
        $rows = array_map(fn ($v) => [array_merge(['id' => 'monetapay', 'name' => 'Monetapay', 'held_balance' => null, 'raw' => null], $v)], $values);

        $this->mock(GetPaymentGatewayBalancesAction::class, function ($mock) use ($rows) {
            $mock->shouldReceive('execute')->andReturn(...$rows);
        });
    }

    public function test_config_audit_flags_mismatch_and_unlisted_channels(): void
    {
        PaymentChannel::factory()->create(['channel_code' => 'dana', 'payment_type' => 'ewallet', 'gateway_fee_flat' => 0, 'gateway_fee_percent' => 1.6]);
        PaymentChannel::factory()->create(['channel_code' => 'ovo', 'payment_type' => 'ewallet', 'gateway_fee_flat' => 0, 'gateway_fee_percent' => 5.0]);
        PaymentChannel::factory()->create(['channel_code' => 'bsi_va', 'payment_type' => 'virtual_account', 'gateway_fee_flat' => 1500, 'gateway_fee_percent' => 0]);
        $this->fakeBalance(['active_balance' => 0.0]);

        $report = app(ReconcileGatewayFeesAction::class)->execute();
        $issues = collect($report['config_audit']['findings'])->keyBy('channel_code');

        $this->assertSame('mismatch', $issues['ovo']['issue']);
        $this->assertSame(1.8, $issues['ovo']['expected']['percent']);
        $this->assertSame('unlisted', $issues['bsi_va']['issue']);
        $this->assertArrayNotHasKey('dana', $issues->toArray());
    }

    public function test_frozen_fee_audit_catches_wrong_and_unlisted_rows(): void
    {
        $dana = PaymentChannel::factory()->create(['channel_code' => 'dana', 'payment_type' => 'ewallet', 'gateway_fee_flat' => 0, 'gateway_fee_percent' => 1.6]);
        $bsi = PaymentChannel::factory()->create(['channel_code' => 'bsi_va', 'payment_type' => 'virtual_account', 'gateway_fee_flat' => 1500, 'gateway_fee_percent' => 0]);
        $this->fakeBalance(['active_balance' => 0.0]);

        // Correct: 1.6% × 100.000 = 1.600.
        Payment::factory()->create(['payment_channel_id' => $dana->id, 'gross_amount' => 100000, 'gateway_fee' => 1600, 'status' => '3', 'paid_at' => now()]);
        // Wrong frozen fee.
        Payment::factory()->create(['payment_channel_id' => $dana->id, 'gross_amount' => 100000, 'gateway_fee' => 1000, 'status' => '3', 'paid_at' => now()]);
        // Unlisted channel — no contract figure to compare.
        Payment::factory()->create(['payment_channel_id' => $bsi->id, 'gross_amount' => 50000, 'gateway_fee' => 1500, 'status' => '3', 'paid_at' => now()]);

        $audit = app(ReconcileGatewayFeesAction::class)->execute()['frozen_fee_audit'];

        $this->assertSame(3, $audit['checked']);
        $this->assertSame(1, $audit['mismatch_count']);
        $this->assertSame(1, $audit['unlisted_count']);
    }

    public function test_balance_reconciliation_baselines_then_matches_delta(): void
    {
        $t0 = Carbon::parse('2026-08-21 00:00:00');
        // Run 1 = baseline; run 2 sees a +99.300 net collection and a balance that agrees.
        $this->fakeBalance(['active_balance' => 1_000_000.0], ['active_balance' => 1_099_300.0]);
        $action = app(ReconcileGatewayFeesAction::class);

        $this->travelTo($t0);
        $baseline = $action->execute()['balance_reconciliation'];
        $this->assertTrue($baseline['baseline']);
        $this->assertSame(1, GatewayBalanceSnapshot::count());

        $this->travelTo($t0->copy()->addMinute());
        $channel = PaymentChannel::factory()->create(['channel_code' => 'qris', 'payment_type' => 'qris', 'gateway_fee_percent' => 0.7]);
        Payment::factory()->create(['payment_channel_id' => $channel->id, 'gross_amount' => 100000, 'gateway_fee' => 700, 'status' => '3', 'paid_at' => now()]);

        $this->travelTo($t0->copy()->addMinutes(2));
        $recon = $action->execute()['balance_reconciliation'];

        $this->assertFalse($recon['baseline']);
        $this->assertSame(99300, $recon['expected_movement']);
        $this->assertSame(99300, $recon['reported_delta']);
        $this->assertSame(0, $recon['delta']);
        $this->assertTrue($recon['within_tolerance']);
        $this->assertSame(2, GatewayBalanceSnapshot::count());

        $this->travelBack();
    }

    public function test_balance_drift_beyond_tolerance_is_reported(): void
    {
        $t0 = Carbon::parse('2026-08-21 00:00:00');
        // Baseline 1.000.000, then jumps to 1.050.000 with no bookings to explain it.
        $this->fakeBalance(['active_balance' => 1_000_000.0], ['active_balance' => 1_050_000.0]);
        $action = app(ReconcileGatewayFeesAction::class);

        $this->travelTo($t0);
        $action->execute();

        $this->travelTo($t0->copy()->addMinute());
        $recon = $action->execute()['balance_reconciliation'];

        $this->assertSame(50000, $recon['reported_delta']);
        $this->assertSame(0, $recon['expected_movement']);
        $this->assertSame(50000, $recon['delta']);
        $this->assertFalse($recon['within_tolerance']);

        $this->travelBack();
    }
}
