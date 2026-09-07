<?php

namespace Tests\Feature\PaymentPage;

use App\Models\PaymentChannel;
use App\Models\Product;
use App\Models\Role;
use App\Models\SupplierProduct;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Tax (PPN) is levied on the channel fee and is kita's expense: it is frozen
 * onto the transaction/payment at checkout, netted from profit at settlement,
 * and never added to what the customer pays.
 *
 * Worked example (the user's): item 60.000 via a 0,7% channel → admin fee 420,
 * total 60.420; PPN 11% × 420 = 46; the customer still pays 60.420.
 */
class ChannelTaxTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.uxiolabs.api_key' => 'test-api-key']);
        Http::fake(['*/order' => Http::response(['status' => true, 'msg' => 'ok', 'data' => ['status' => 'pending', 'id' => 'UX1']])]);
    }

    private function internal(): User
    {
        return User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Payment-Internal'])->id]);
    }

    /** Checkout the QRIS example on a wallet channel (synchronous settlement). */
    private function checkoutWithTax(): void
    {
        User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Payment-Admin'])->id]);

        $product = Product::factory()->create(['price_member' => 60000]);
        SupplierProduct::factory()->for($product)->create(['price' => 50000]);

        // balance() zeroes the gateway cut, isolating the tax in the profit math.
        $channel = PaymentChannel::factory()->balance()->create([
            'fee_flat' => 0,
            'fee_percent' => 0.7,
            'tax_percent' => 11,
        ]);

        $buyer = User::factory()->create([
            'role_id' => Role::firstOrCreate(['name' => 'Member'])->id,
            'balance' => 100000,
        ]);
        Sanctum::actingAs($buyer, ['access-api']);

        $this->postJson('/api/v1/checkout', [
            'product_id' => $product->id,
            'payment_channel_id' => $channel->id,
            'target_uid' => '12345678',
            'email' => 'buyer@example.com',
        ])->assertCreated();
    }

    public function test_channel_update_persists_tax_percent(): void
    {
        $channel = PaymentChannel::factory()->create(['channel_code' => 'qris', 'payment_type' => 'qris']);
        Sanctum::actingAs($this->internal(), ['access-api']);

        $this->putJson("/api/v1/payment-internal/channels/{$channel->id}", ['tax_percent' => 11])
            ->assertOk()
            ->assertJsonPath('data.tax_percent', 11);

        $this->assertEqualsWithDelta(11.0, (float) $channel->fresh()->tax_percent, 0.001);
    }

    public function test_checkout_freezes_tax_on_the_fee_without_charging_the_customer(): void
    {
        $this->checkoutWithTax();

        // Fee 420, tax 46 (11% of 420) — total stays 60.420 (no tax added).
        $this->assertDatabaseHas('transactions', [
            'amount_base' => 60000,
            'amount_fee' => 420,
            'amount_total' => 60420,
            'tax_amount' => 46,
        ]);
        $this->assertDatabaseHas('payments', ['gross_amount' => 60420, 'tax_amount' => 46]);
    }

    public function test_internal_feed_nets_tax_from_profit_kita(): void
    {
        $this->checkoutWithTax();
        Sanctum::actingAs($this->internal(), ['access-api']);

        $this->getJson('/api/v1/payment-internal/transactions?type=sale')
            ->assertOk()
            ->assertJsonPath('data.data.0.admin_fee', 420)
            ->assertJsonPath('data.data.0.gateway_fee', 0)
            // Profit Kita = admin fee − gateway fee − tax = 420 − 0 − 46.
            ->assertJsonPath('data.data.0.platform_profit', 374);
    }

    public function test_dashboard_reports_total_tax(): void
    {
        $this->checkoutWithTax();
        Sanctum::actingAs($this->internal(), ['access-api']);

        $this->getJson('/api/v1/payment-internal/dashboard')
            ->assertOk()
            ->assertJsonPath('data.total_tax', 46);
    }
}
