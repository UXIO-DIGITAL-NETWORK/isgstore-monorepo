<?php

declare(strict_types=1);

namespace Tests\Feature\Hub;

use App\Models\PaymentChannel;
use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceInvoice;
use App\Models\User;
use App\Models\Withdrawal;
use App\Support\Ledger\PlatformLedger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The site's reporting contract for the Hub. Two things are pinned here:
 * the gate (key + IP, dead-by-default) and the payload SHAPE — the contract is
 * additive-only, so a field disappearing from these assertions means a
 * breaking change that would corrupt the Hub's aggregation for every site
 * still on an older deploy.
 */
class HubReportEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private const KEY = 'hub_live_testkey123';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.hub.api_key' => self::KEY,
            'services.hub.allowed_ips' => '',
            // Summary calls the gateway for its balance; fake it so no test
            // ever leaves the machine.
            'services.monetapay.token' => 'test-token',
        ]);
        Http::fake(['*' => Http::response(['code' => 0, 'data' => ['balance' => 123000]])]);
    }

    private function pull(string $path)
    {
        return $this->getJson($path, ['X-Hub-Key' => self::KEY]);
    }

    public function test_endpoints_are_dead_without_a_configured_key(): void
    {
        config(['services.hub.api_key' => null]);

        // Even presenting the "right" key fails when none is configured.
        $this->getJson('/api/v1/hub/summary', ['X-Hub-Key' => self::KEY])->assertStatus(403);
        $this->getJson('/api/v1/hub/summary')->assertStatus(403);
    }

    public function test_a_wrong_or_missing_key_is_rejected(): void
    {
        $this->getJson('/api/v1/hub/summary')->assertStatus(403);
        $this->getJson('/api/v1/hub/summary', ['X-Hub-Key' => 'wrong'])->assertStatus(403);
    }

    public function test_an_unlisted_source_ip_is_rejected_when_allowlist_set(): void
    {
        config(['services.hub.allowed_ips' => '10.9.9.9']);
        $this->pull('/api/v1/hub/summary')->assertStatus(403);

        // The test client reports 127.0.0.1 — listing it opens the gate.
        config(['services.hub.allowed_ips' => '10.9.9.9, 127.0.0.1']);
        $this->pull('/api/v1/hub/summary')->assertOk();
    }

    public function test_summary_shape_is_pinned(): void
    {
        PlatformLedger::record(amount: 50000, type: 'markup', reference: 'SEED-1');

        $this->pull('/api/v1/hub/summary')
            ->assertOk()
            ->assertJsonPath('data.profit_total', 50000)
            ->assertJsonPath('data.platform_available', 50000)
            ->assertJsonPath('data.gateway_balance', 123000)
            ->assertJsonStructure(['data' => [
                'generated_at', 'profit_total', 'platform_available',
                'pending_withdrawals_count', 'pending_withdrawals_amount',
                'oldest_pending_minutes', 'active_subscriptions_count',
                'paid_service_invoices_this_month', 'gateway_balance',
            ]]);
    }

    public function test_summary_survives_a_dead_gateway(): void
    {
        Http::fake(['*' => fn () => throw new ConnectionException('down')]);

        $this->pull('/api/v1/hub/summary')
            ->assertOk()
            ->assertJsonPath('data.gateway_balance', null);
    }

    public function test_withdrawals_lists_open_rows_with_type_discriminator(): void
    {
        $role = Role::firstOrCreate(['name' => 'Payment-Admin']);
        $merchant = User::factory()->create(['role_id' => $role->id]);

        Withdrawal::create([
            'merchant_id' => $merchant->id,
            'withdrawal_number' => 'WD-merchant1',
            'amount' => 50000, 'fee' => 1665, 'nett' => 48335,
            'bank_code' => 'BCA', 'account_name' => 'Toko', 'status' => 'PENDING',
        ]);
        Withdrawal::create([
            'merchant_id' => null,
            'requested_by' => $merchant->id,
            'withdrawal_number' => 'WD-internal1',
            'amount' => 30000, 'fee' => 1665, 'nett' => 28335,
            'bank_code' => 'BCA', 'account_name' => 'Kas', 'status' => 'PENDING',
        ]);

        $rows = $this->pull('/api/v1/hub/withdrawals')->assertOk()->json('data');

        $this->assertCount(2, $rows);
        $byNumber = collect($rows)->keyBy('withdrawal_number');
        $this->assertSame('merchant', $byNumber['WD-merchant1']['type']);
        $this->assertSame('internal', $byNumber['WD-internal1']['type']);
        $this->assertSame($merchant->name, $byNumber['WD-merchant1']['merchant_name']);
        $this->assertNull($byNumber['WD-internal1']['merchant_name']);
        $this->assertArrayHasKey('age_minutes', $byNumber['WD-merchant1']);
    }

    public function test_profit_groups_by_date_and_type(): void
    {
        PlatformLedger::record(amount: 10000, type: 'markup', reference: 'A');
        PlatformLedger::record(amount: 5000, type: 'markup', reference: 'B');
        PlatformLedger::record(amount: 1665, type: 'withdrawal_fee', reference: 'C');

        $rows = $this->pull('/api/v1/hub/profit?days=7')->assertOk()->json('data');

        $byType = collect($rows)->keyBy('type');
        $this->assertSame(15000, $byType['markup']['total']);
        $this->assertSame(1665, $byType['withdrawal_fee']['total']);
        $this->assertSame(now()->toDateString(), $byType['markup']['date']);
    }

    public function test_channels_exposes_the_fee_schedule(): void
    {
        PaymentChannel::factory()->create([
            'channel_code' => 'qris',
            'payment_type' => 'qris',
            'fee_flat' => 0, 'fee_percent' => 0.8,
            'gateway_fee_flat' => 0, 'gateway_fee_percent' => 0.7,
            'tax_percent' => 11,
        ]);

        $rows = $this->pull('/api/v1/hub/channels')->assertOk()->json('data');
        $qris = collect($rows)->firstWhere('channel_code', 'qris');

        $this->assertSame(0.8, $qris['fee_percent']);
        $this->assertSame(0.7, $qris['gateway_fee_percent']);
        $this->assertTrue($qris['is_active']);
    }

    public function test_service_orders_lists_recent_invoices(): void
    {
        $role = Role::firstOrCreate(['name' => 'Payment-Admin']);
        $merchant = User::factory()->create(['role_id' => $role->id, 'name' => 'Klien A']);
        $service = Service::create([
            'code' => 'uxiotopup', 'name' => 'Uxiotopup', 'category' => 'supplier',
            'selling_price' => 250000, 'duration_days' => 30,
        ]);
        ServiceInvoice::create([
            'invoice_number' => 'SINV-202608-TEST01',
            'merchant_id' => $merchant->id,
            'service_id' => $service->id,
            'service_name' => 'Uxiotopup',
            'amount' => 250000, 'duration_days' => 30, 'status' => 'UNPAID',
        ]);

        $rows = $this->pull('/api/v1/hub/service-orders')->assertOk()->json('data');

        $this->assertCount(1, $rows);
        $this->assertSame('SINV-202608-TEST01', $rows[0]['invoice_number']);
        $this->assertSame('uxiotopup', $rows[0]['service_code']);
        $this->assertSame('Klien A', $rows[0]['merchant_name']);
        $this->assertSame('UNPAID', $rows[0]['status']);
    }
}
