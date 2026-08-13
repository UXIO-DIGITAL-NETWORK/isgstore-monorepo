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

class FeeBreakdownTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.digiflazz.username' => 'testuser', 'services.digiflazz.key' => 'testkey']);
        Http::fake(['*/transaction' => Http::response(['data' => ['status' => 'Pending', 'trx_id' => 'DF1']])]);
    }

    private function checkout(): array
    {
        $product = Product::factory()->create(['price_member' => 10000]);
        SupplierProduct::factory()->for($product)->create(['price' => 8000]);
        // A "balance" channel with a non-zero channel fee (paid synchronously).
        // That fee is the whole "Biaya Admin" — there is no second markup.
        $channel = PaymentChannel::factory()->balance()->create(['fee_flat' => 100, 'fee_percent' => 0]);

        $role = Role::factory()->create(['name' => 'Member']);
        $user = User::factory()->create(['role_id' => $role->id, 'balance' => 100000]);
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/checkout', [
            'product_id' => $product->id,
            'payment_channel_id' => $channel->id,
            'target_uid' => '12345678',
            'email' => 'buyer@example.com',
        ]);

        return [$response, $product];
    }

    public function test_checkout_persists_and_returns_the_admin_fee(): void
    {
        [$response] = $this->checkout();

        // The channel's fee of 100 is the admin fee; total = 10000 + 100.
        $response->assertCreated()
            ->assertJsonPath('data.payment.admin_fee', 100)
            ->assertJsonPath('data.payment.amount', 10100)
            ->assertJsonMissingPath('data.payment.channel_fee')
            ->assertJsonMissingPath('data.payment.admin_markup');

        $this->assertDatabaseHas('transactions', [
            'amount_base' => 10000,
            'channel_fee' => 100,
            'admin_markup' => 0,
            'amount_fee' => 100,
            'amount_total' => 10100,
        ]);
        $this->assertDatabaseHas('payments', [
            'channel_fee' => 100,
            'admin_markup' => 0,
            'admin_fee' => 100,
            'gross_amount' => 10100,
        ]);
    }

    public function test_invoice_exposes_the_admin_fee(): void
    {
        [$response] = $this->checkout();
        $invoiceNumber = $response->json('data.invoice_number');

        $this->getJson("/api/v1/invoices/{$invoiceNumber}")
            ->assertOk()
            ->assertJsonPath('data.amount.admin_fee', 100)
            ->assertJsonPath('data.amount.fee', 100)
            ->assertJsonPath('data.amount.total', 10100)
            ->assertJsonMissingPath('data.amount.channel_fee');
    }

    public function test_payment_channels_no_longer_expose_a_global_admin_fee(): void
    {
        $this->getJson('/api/v1/storefront/payment-channels')
            ->assertOk()
            ->assertJsonStructure(['data' => ['channels']])
            ->assertJsonMissingPath('data.admin_fee');
    }
}
