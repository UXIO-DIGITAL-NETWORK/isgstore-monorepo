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
 * Kita's profit is the admin fee net of the payment gateway's cut. The gateway
 * fee is a per-channel percentage of the whole amount the customer pays, frozen
 * at checkout — not read from Monetapay's callback.
 *
 * The user's worked example: Total 63.000 = item 60.000 + admin fee 3.000;
 * gateway fee = 0.7% × 63.000 = 441; Profit Kita = 3.000 − 441 = 2.559.
 */
class GatewayFeeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.digiflazz.username' => 'testuser', 'services.digiflazz.key' => 'testkey']);
        Http::fake(['*/transaction' => Http::response(['data' => ['status' => 'Pending', 'trx_id' => 'DF1']])]);
    }

    /** Checkout on a 0.7% channel, matching the user's 63.000 example. */
    private function checkout(): void
    {
        User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Payment-Admin'])->id]);

        $product = Product::factory()->create(['price_member' => 60000]);
        SupplierProduct::factory()->for($product)->create(['price' => 50000]);

        // Synchronous (wallet) settlement avoids the Monetapay round-trip; the
        // 3.000 flat fee is the admin fee, 0.7% is the gateway cut being tested.
        $channel = PaymentChannel::factory()->balance()->create([
            'fee_flat' => 3000,
            'fee_percent' => 0,
            'gateway_fee_percent' => 0.7,
        ]);

        $buyer = User::factory()->create([
            'role_id' => Role::firstOrCreate(['name' => 'Member'])->id,
            'balance' => 100000,
        ]);
        Sanctum::actingAs($buyer);

        $this->postJson('/api/v1/checkout', [
            'product_id' => $product->id,
            'payment_channel_id' => $channel->id,
            'target_uid' => '12345678',
            'email' => 'buyer@example.com',
        ])->assertCreated();
    }

    public function test_checkout_freezes_the_gateway_fee_as_a_percent_of_total(): void
    {
        $this->checkout();

        $this->assertDatabaseHas('transactions', ['amount_base' => 60000, 'amount_fee' => 3000, 'amount_total' => 63000]);
        // 0.7% × 63.000 = 441.
        $this->assertDatabaseHas('payments', ['gross_amount' => 63000, 'gateway_fee' => 441]);
    }

    public function test_internal_feed_reports_fee_gateway_and_profit_kita(): void
    {
        $this->checkout();

        Sanctum::actingAs(User::factory()->create([
            'role_id' => Role::firstOrCreate(['name' => 'Payment-Internal'])->id,
        ]));

        $this->getJson('/api/v1/payment-internal/transactions?type=sale')
            ->assertOk()
            ->assertJsonPath('data.data.0.admin_fee', 3000)
            ->assertJsonPath('data.data.0.gateway_fee', 441)
            // Profit Kita = admin fee − gateway fee.
            ->assertJsonPath('data.data.0.platform_profit', 2559);
    }

    public function test_checkout_freezes_a_flat_gateway_fee_for_va_style_channels(): void
    {
        User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Payment-Admin'])->id]);
        $product = Product::factory()->create(['price_member' => 60000]);
        SupplierProduct::factory()->for($product)->create(['price' => 50000]);

        // Flat gateway fee (Rp 1.900, like Mandiri VA), no percent — frozen as-is
        // regardless of the total.
        $channel = PaymentChannel::factory()->balance()->create([
            'fee_flat' => 3000,
            'gateway_fee_flat' => 1900,
            'gateway_fee_percent' => 0,
        ]);

        $buyer = User::factory()->create([
            'role_id' => Role::firstOrCreate(['name' => 'Member'])->id,
            'balance' => 100000,
        ]);
        Sanctum::actingAs($buyer);

        $this->postJson('/api/v1/checkout', [
            'product_id' => $product->id,
            'payment_channel_id' => $channel->id,
            'target_uid' => '12345678',
            'email' => 'buyer@example.com',
        ])->assertCreated();

        $this->assertDatabaseHas('payments', ['gross_amount' => 63000, 'gateway_fee' => 1900]);
    }

    public function test_wallet_channel_takes_no_gateway_cut(): void
    {
        User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Payment-Admin'])->id]);

        $product = Product::factory()->create(['price_member' => 60000]);
        SupplierProduct::factory()->for($product)->create(['price' => 50000]);
        $channel = PaymentChannel::factory()->balance()->create(['fee_flat' => 3000]);

        $buyer = User::factory()->create([
            'role_id' => Role::firstOrCreate(['name' => 'Member'])->id,
            'balance' => 100000,
        ]);
        Sanctum::actingAs($buyer);

        $this->postJson('/api/v1/checkout', [
            'product_id' => $product->id,
            'payment_channel_id' => $channel->id,
            'target_uid' => '12345678',
            'email' => 'buyer@example.com',
        ])->assertCreated();

        $this->assertDatabaseHas('payments', ['gross_amount' => 63000, 'gateway_fee' => 0]);
    }
}
