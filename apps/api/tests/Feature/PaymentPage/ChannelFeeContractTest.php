<?php

namespace Tests\Feature\PaymentPage;

use App\Models\PaymentChannel;
use App\Models\Role;
use App\Models\User;
use App\Support\Payment\MonetapayContractFees;
use Database\Seeders\PaymentChannelSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ChannelFeeContractTest extends TestCase
{
    use RefreshDatabase;

    private function internal(): User
    {
        return User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Payment-Internal'])->id]);
    }

    /**
     * bca_va is not in the Monetapay contract, so its rate can never be
     * verified — deactivated by decision (27 Aug 2026). The row stays (history
     * must keep resolving) but is never offered.
     */
    public function test_bca_va_is_seeded_inactive(): void
    {
        $this->seed(PaymentChannelSeeder::class);

        $bca = PaymentChannel::where('channel_code', 'bca_va')->firstOrFail();
        $this->assertFalse((bool) $bca->is_active);

        // Every other seeded channel remains active.
        $this->assertSame(
            0,
            PaymentChannel::where('channel_code', '!=', 'bca_va')->where('is_active', false)->count(),
        );
    }

    /** The shipped seeder must mirror the Monetapay contract — bca_va aside. */
    public function test_seeder_matches_the_contract(): void
    {
        $this->seed(PaymentChannelSeeder::class);

        foreach (PaymentChannel::all() as $channel) {
            $this->assertTrue(
                MonetapayContractFees::has($channel->channel_code),
                "Seeded channel {$channel->channel_code} is missing from the contract table."
            );
            $this->assertSame(
                (int) MonetapayContractFees::flatFor($channel->channel_code),
                (int) $channel->gateway_fee_flat,
                "Flat gateway fee for {$channel->channel_code} drifted from the contract."
            );
            $this->assertEqualsWithDelta(
                (float) MonetapayContractFees::percentFor($channel->channel_code),
                (float) $channel->gateway_fee_percent,
                0.001,
                "Percent gateway fee for {$channel->channel_code} drifted from the contract."
            );
        }
    }

    public function test_saving_the_contract_rate_reports_no_mismatch(): void
    {
        $channel = PaymentChannel::factory()->create([
            'channel_code' => 'dana',
            'payment_type' => 'ewallet',
            'gateway_fee_flat' => 0,
            'gateway_fee_percent' => 1.6,
        ]);
        Sanctum::actingAs($this->internal(), ['access-api']);

        $this->putJson("/api/v1/payment-internal/channels/{$channel->id}", ['gateway_fee_percent' => 1.6])
            ->assertOk()
            ->assertJsonPath('data.contract_mismatch', false)
            ->assertJsonPath('data.contract_expected.gateway_fee_percent', 1.6);
    }

    public function test_saving_a_divergent_rate_flags_and_logs(): void
    {
        Log::spy();

        $channel = PaymentChannel::factory()->create([
            'channel_code' => 'dana',
            'payment_type' => 'ewallet',
            'gateway_fee_flat' => 0,
            'gateway_fee_percent' => 1.6,
        ]);
        Sanctum::actingAs($this->internal(), ['access-api']);

        $this->putJson("/api/v1/payment-internal/channels/{$channel->id}", ['gateway_fee_percent' => 5.0])
            ->assertOk()
            ->assertJsonPath('data.contract_mismatch', true)
            ->assertJsonPath('data.contract_expected.gateway_fee_percent', 1.6);

        Log::shouldHaveReceived('warning')
            ->withArgs(fn ($msg) => str_contains($msg, 'diverges from Monetapay contract'))
            ->once();
    }

    public function test_unlisted_channel_is_flagged_as_mismatch(): void
    {
        // bsi_va is not in the Monetapay contract — no rate to compare against.
        $channel = PaymentChannel::factory()->create([
            'channel_code' => 'bsi_va',
            'payment_type' => 'virtual_account',
            'gateway_fee_flat' => 1500,
            'gateway_fee_percent' => 0,
        ]);
        Sanctum::actingAs($this->internal(), ['access-api']);

        $this->putJson("/api/v1/payment-internal/channels/{$channel->id}", ['gateway_fee_flat' => 1500])
            ->assertOk()
            ->assertJsonPath('data.contract_mismatch', true)
            ->assertJsonPath('data.contract_expected', null);
    }
}
