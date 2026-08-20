<?php

namespace Tests\Feature\Checkout;

use App\Models\PaymentChannel;
use App\Models\Product;
use App\Models\Promo;
use App\Models\Role;
use App\Models\SupplierProduct;
use App\Models\User;
use App\Services\Payment\MonetapayService;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Guards the transaction-boundary refactor: the external gateway call runs
 * BEFORE the DB transaction, so a gateway failure must persist nothing (no
 * orphan Transaction/Payment), and a success must persist the returned
 * instructions. MonetapayService is mocked so the test drives CheckoutAction's
 * ordering directly, not Monetapay's encryption.
 */
class CheckoutGatewayBoundaryTest extends TestCase
{
    use RefreshDatabase;

    private Product $product;

    private PaymentChannel $qrisChannel;

    protected function setUp(): void
    {
        parent::setUp();

        $this->product = Product::factory()->create(['price_member' => 12000]);
        SupplierProduct::factory()->for($this->product)->create(['price' => 10000]);
        $this->qrisChannel = PaymentChannel::factory()->create([
            'payment_type' => 'qris',
            'channel_code' => 'qris',
            'is_active' => true,
            'min_amount' => 0,
            'fee_flat' => 0,
            'fee_percent' => 0,
            'gateway_fee_flat' => 0,
            'gateway_fee_percent' => 0,
        ]);
    }

    private function actingAsMember(): User
    {
        $role = Role::factory()->create(['name' => 'Member']);
        $user = User::factory()->create(['role_id' => $role->id, 'balance' => 100000]);
        Sanctum::actingAs($user);

        return $user;
    }

    private function payload(): array
    {
        return [
            'product_id' => $this->product->id,
            'payment_channel_id' => $this->qrisChannel->id,
            'target_uid' => '12345678',
            'email' => 'buyer@example.com',
        ];
    }

    public function test_gateway_failure_persists_no_transaction_or_payment(): void
    {
        $this->mock(MonetapayService::class, function ($mock) {
            $mock->shouldReceive('createTransaction')->once()->andThrow(new Exception('gateway down'));
        });

        $this->actingAsMember();

        $this->postJson('/api/v1/checkout', $this->payload())->assertStatus(400);

        // The whole point of the refactor: a failed gateway call leaves no rows.
        $this->assertDatabaseCount('transactions', 0);
        $this->assertDatabaseCount('payments', 0);
    }

    public function test_gateway_success_persists_instructions_and_reference(): void
    {
        $this->mock(MonetapayService::class, function ($mock) {
            $mock->shouldReceive('createTransaction')->once()->andReturn([
                'data' => ['order_no' => 'MP-ORDER-1', 'qr_string' => 'QR-PAYLOAD-123'],
            ]);
        });

        $user = $this->actingAsMember();

        $this->postJson('/api/v1/checkout', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.payment.status', 'PENDING')
            ->assertJsonPath('data.payment.instructions.qr_string', 'QR-PAYLOAD-123');

        $this->assertDatabaseHas('transactions', [
            'product_id' => $this->product->id,
            'user_id' => $user->id,
            'status' => 'PENDING',
        ]);
        // Gateway reference + instructions persisted inside the write transaction.
        $this->assertDatabaseHas('payments', [
            'pg_transaction_id' => 'MP-ORDER-1',
            'status' => '1', // PENDING
        ]);
        // Balance untouched — QRIS is an external payment, not the wallet path.
        $this->assertSame(100000, $user->fresh()->balance);
    }

    public function test_promo_checkout_mints_gateway_order_and_redeems_under_the_lock(): void
    {
        // A promo checkout calls the gateway INSIDE the transaction (after the
        // quota lock+recheck), so this verifies that branch: the order is minted,
        // the redemption recorded, and used_count incremented.
        $this->mock(MonetapayService::class, function ($mock) {
            $mock->shouldReceive('createTransaction')->once()->andReturn([
                'data' => ['order_no' => 'MP-PROMO-1', 'qr_string' => 'QR-PROMO'],
            ]);
        });

        $promo = Promo::create([
            'code' => 'HEMAT2K',
            'name' => 'Potongan 2rb',
            'type' => 'fixed',
            'value' => 2000,
            'min_purchase' => 0,
            'scope' => 'global',
            'quota_total' => 5,
            'used_count' => 0,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDay(),
            'is_active' => true,
        ]);

        $user = $this->actingAsMember();

        $this->postJson('/api/v1/checkout', $this->payload() + ['promo_code' => 'HEMAT2K'])
            ->assertCreated()
            ->assertJsonPath('data.payment.instructions.qr_string', 'QR-PROMO')
            // Discounted base: 12000 - 2000 = 10000.
            ->assertJsonPath('data.product.price', 10000);

        $this->assertDatabaseHas('transactions', [
            'product_id' => $this->product->id,
            'promo_id' => $promo->id,
            'discount_amount' => 2000,
            'amount_base' => 10000,
        ]);
        $this->assertDatabaseHas('payments', ['pg_transaction_id' => 'MP-PROMO-1']);
        $this->assertSame(1, $promo->fresh()->used_count);
    }
}
