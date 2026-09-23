<?php

namespace Tests\Feature\Stock;

use App\Models\PaymentChannel;
use App\Models\Product;
use App\Models\Role;
use App\Models\SupplierProduct;
use App\Models\Transaction;
use App\Models\User;
use App\Support\Stock\DailyStockLimit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The daily selling allowance.
 *
 * This is a LOCAL quota, not the provider's stock: uxiolabs reports no quantity
 * and has no availability probe, so what is enforced is the operator's own
 * ceiling. It is counted from `transactions` rather than decremented, which is
 * what lets a failed or expired order release its slot with no release path.
 */
class DailyStockLimitTest extends TestCase
{
    use RefreshDatabase;

    private Product $product;

    private SupplierProduct $mapping;

    private PaymentChannel $balanceChannel;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.uxiolabs.api_key' => 'test-api-key']);

        $this->product = Product::factory()->create(['price_member' => 12000]);
        $this->mapping = SupplierProduct::factory()->for($this->product)->create(['price' => 10000]);
        $this->balanceChannel = PaymentChannel::factory()->balance()->create();
    }

    private function actingAsMember(int $balance = 100000): User
    {
        $role = Role::factory()->create(['name' => 'Member']);
        $user = User::factory()->create(['role_id' => $role->id, 'balance' => $balance]);
        Sanctum::actingAs($user, ['access-api']);

        return $user;
    }

    /** A prior order on this product, in whatever state the case needs. */
    private function order(string $status, ?string $createdAt = null): Transaction
    {
        return Transaction::factory()->create([
            'product_id' => $this->product->id,
            'status' => $status,
            'created_at' => $createdAt ?? now(),
        ]);
    }

    public function test_the_limit_refuses_the_order_that_would_exceed_it(): void
    {
        Http::fake([
            '*/order' => Http::response(['status' => true, 'msg' => 'ok', 'data' => ['status' => 'pending', 'id' => 'UX1']]),
        ]);

        $this->mapping->update(['daily_order_limit' => 1]);
        $this->actingAsMember();

        $payload = [
            'product_id' => $this->product->id,
            'payment_channel_id' => $this->balanceChannel->id,
            'email' => 'buyer@example.com',
        ];

        $this->postJson('/api/v1/checkout', $payload + ['target_uid' => '12345678'])->assertCreated();

        // A different player id, so what refuses this order is the day's
        // allowance and not the duplicate-submit guard.
        $this->postJson('/api/v1/checkout', $payload + ['target_uid' => '87654321'])
            ->assertStatus(400)
            ->assertJsonPath('message', DailyStockLimit::EXHAUSTED_MESSAGE);

        $this->assertDatabaseCount('transactions', 1);
    }

    public function test_a_mapping_with_no_ceiling_is_never_exhausted(): void
    {
        Http::fake([
            '*/order' => Http::response(['status' => true, 'msg' => 'ok', 'data' => ['status' => 'pending', 'id' => 'UX1']]),
        ]);

        $this->actingAsMember();

        $payload = [
            'product_id' => $this->product->id,
            'payment_channel_id' => $this->balanceChannel->id,
            'email' => 'buyer@example.com',
        ];

        // Null is the default every row ships with, so nothing changes for a SKU
        // nobody has capped.
        $this->postJson('/api/v1/checkout', $payload + ['target_uid' => '12345678'])->assertCreated();
        $this->postJson('/api/v1/checkout', $payload + ['target_uid' => '87654321'])->assertCreated();

        $this->assertDatabaseCount('transactions', 2);
    }

    public function test_an_order_that_failed_or_expired_releases_its_slot(): void
    {
        $this->mapping->update(['daily_order_limit' => 1]);

        // Three orders, none of which is a sale — a slot each would leave the SKU
        // dark for the rest of the day with nothing to show for it.
        $this->order('FAILED_PROVIDER');
        $this->order('EXPIRED');
        $this->order('REFUNDED');

        $this->assertSame(0, DailyStockLimit::usedToday((int) $this->product->id));
        $this->assertFalse(DailyStockLimit::isExhausted($this->product, $this->mapping->fresh()));
    }

    public function test_yesterdays_orders_do_not_count_against_today(): void
    {
        $this->mapping->update(['daily_order_limit' => 1]);
        $this->order('COMPLETED', now()->subDay()->toDateTimeString());

        // The allowance is a WIB day, so it resets at midnight Jakarta — not at
        // whatever midnight the server happens to keep.
        $this->assertSame(0, DailyStockLimit::usedToday((int) $this->product->id));
        $this->assertSame(1, DailyStockLimit::remaining($this->product, $this->mapping->fresh()));
    }

    public function test_remaining_counts_only_the_orders_still_holding_a_slot(): void
    {
        $this->mapping->update(['daily_order_limit' => 3]);
        $this->order('PENDING');
        $this->order('COMPLETED');
        $this->order('EXPIRED');

        $this->assertSame(1, DailyStockLimit::remaining($this->product, $this->mapping->fresh()));
    }

    public function test_the_catalogue_reports_what_is_left_today(): void
    {
        $this->mapping->update(['daily_order_limit' => 2]);
        $this->order('COMPLETED');

        $row = collect($this->getJson('/api/v1/games/'.$this->product->category->code.'/products')
            ->assertOk()
            ->json('data.products'))
            ->firstWhere('id', $this->product->id);

        $this->assertSame(1, $row['stock_left']);
        $this->assertFalse($row['is_sold_out']);
    }

    public function test_the_catalogue_flags_a_spent_allowance_as_sold_out(): void
    {
        $this->mapping->update(['daily_order_limit' => 1]);
        $this->order('COMPLETED');

        $row = collect($this->getJson('/api/v1/games/'.$this->product->category->code.'/products')
            ->assertOk()
            ->json('data.products'))
            ->firstWhere('id', $this->product->id);

        // Null and 0 mean different things to the storefront: no ceiling versus
        // nothing left today.
        $this->assertSame(0, $row['stock_left']);
        $this->assertTrue($row['is_sold_out']);
    }
}
