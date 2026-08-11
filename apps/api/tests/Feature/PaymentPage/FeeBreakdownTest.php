<?php

namespace Tests\Feature\PaymentPage;

use App\Models\PaymentChannel;
use App\Models\Product;
use App\Models\Role;
use App\Models\SupplierProduct;
use App\Models\User;
use App\Support\Pricing\AdminFeeSetting;
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
        $channel = PaymentChannel::factory()->balance()->create(['fee_flat' => 100, 'fee_percent' => 0]);

        // Global admin markup: fixed Rp 500 on top of the channel fee.
        AdminFeeSetting::save('fixed', 500);

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

    public function test_checkout_persists_and_returns_the_fee_split(): void
    {
        [$response] = $this->checkout();

        // channel fee 100 + admin markup 500 = 600 total; total = 10000 + 600.
        $response->assertCreated()
            ->assertJsonPath('data.payment.channel_fee', 100)
            ->assertJsonPath('data.payment.admin_markup', 500)
            ->assertJsonPath('data.payment.admin_fee', 600)
            ->assertJsonPath('data.payment.amount', 10600);

        $this->assertDatabaseHas('transactions', [
            'amount_base' => 10000,
            'channel_fee' => 100,
            'admin_markup' => 500,
            'amount_fee' => 600,
            'amount_total' => 10600,
        ]);
        $this->assertDatabaseHas('payments', [
            'channel_fee' => 100,
            'admin_markup' => 500,
            'admin_fee' => 600,
            'gross_amount' => 10600,
        ]);
    }

    public function test_invoice_exposes_the_fee_breakdown(): void
    {
        [$response] = $this->checkout();
        $invoiceNumber = $response->json('data.invoice_number');

        $this->getJson("/api/v1/invoices/{$invoiceNumber}")
            ->assertOk()
            ->assertJsonPath('data.amount.channel_fee', 100)
            ->assertJsonPath('data.amount.admin_fee', 500)
            ->assertJsonPath('data.amount.fee', 600)
            ->assertJsonPath('data.amount.total', 10600);
    }

    public function test_payment_channels_expose_the_admin_fee_setting(): void
    {
        AdminFeeSetting::save('percent', 5);

        $this->getJson('/api/v1/storefront/payment-channels')
            ->assertOk()
            ->assertJsonPath('data.admin_fee.type', 'percent')
            ->assertJsonPath('data.admin_fee.value', 5)
            ->assertJsonStructure(['data' => ['admin_fee' => ['type', 'value'], 'channels']]);
    }
}
