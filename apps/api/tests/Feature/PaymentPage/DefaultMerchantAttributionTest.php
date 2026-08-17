<?php

namespace Tests\Feature\PaymentPage;

use App\Models\PaymentChannel;
use App\Models\Product;
use App\Models\Role;
use App\Models\SupplierProduct;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Products carry no owner, so a checkout must attribute its transaction to the
 * single default client merchant — that attribution is the only reason the sale
 * shows up in the payment-page feeds and settles at PAID.
 */
class DefaultMerchantAttributionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.digiflazz.username' => 'testuser',
            'services.digiflazz.key' => 'testkey',
        ]);

        Http::fake([
            '*/transaction' => Http::response(['data' => ['status' => 'Pending', 'trx_id' => 'DF1']]),
        ]);
    }

    private function balanceCheckout(Product $product): void
    {
        $channel = PaymentChannel::factory()->balance()->create();
        $role = Role::factory()->create(['name' => 'Member']);
        $buyer = User::factory()->create(['role_id' => $role->id, 'balance' => 100000]);
        Sanctum::actingAs($buyer);

        $this->postJson('/api/v1/checkout', [
            'product_id' => $product->id,
            'payment_channel_id' => $channel->id,
            'target_uid' => '12345678',
            'email' => 'buyer@example.com',
        ])->assertCreated();
    }

    public function test_checkout_attributes_an_unowned_product_to_the_default_merchant(): void
    {
        $merchant = User::factory()->create([
            'role_id' => Role::firstOrCreate(['name' => 'Payment-Admin'])->id,
        ]);

        $product = Product::factory()->create(['price_member' => 12000, 'merchant_id' => null]);
        SupplierProduct::factory()->for($product)->create(['price' => 10000]);

        $this->balanceCheckout($product);

        $this->assertSame(
            $merchant->id,
            (int) Transaction::where('product_id', $product->id)->value('merchant_id'),
        );
    }

    public function test_checkout_leaves_merchant_null_when_no_client_merchant_exists(): void
    {
        $product = Product::factory()->create(['price_member' => 12000, 'merchant_id' => null]);
        SupplierProduct::factory()->for($product)->create(['price' => 10000]);

        $this->balanceCheckout($product);

        $this->assertNull(Transaction::where('product_id', $product->id)->value('merchant_id'));
    }
}
