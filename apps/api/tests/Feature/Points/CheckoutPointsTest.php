<?php

namespace Tests\Feature\Points;

use App\Actions\Points\GrantTransactionPointsAction;
use App\Enums\TransactionStatus;
use App\Models\MembershipPlan;
use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\PointLedgerEntry;
use App\Models\Product;
use App\Models\ProductPlanPrice;
use App\Models\Role;
use App\Models\Setting;
use App\Models\SupplierProduct;
use App\Models\Transaction;
use App\Models\User;
use App\Support\Membership\DefaultPlan;
use App\Support\Points\PointRules;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Spending points at checkout. The cases that matter are the ones where money
 * and points meet: a fully covered order (no gateway can charge Rp 0), and the
 * guards that stop a customer spending more than they hold or more than the
 * order is worth.
 */
class CheckoutPointsTest extends TestCase
{
    use RefreshDatabase;

    private Product $product;

    private PaymentChannel $balanceChannel;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.uxiolabs.api_key' => 'test-api-key']);
        Http::fake([
            '*/order' => Http::response(['status' => true, 'msg' => 'ok', 'data' => ['status' => 'pending', 'id' => 'UX1']]),
        ]);

        $this->product = Product::factory()->create(['price_member' => 12000]);
        ProductPlanPrice::create([
            'product_id' => $this->product->id,
            'membership_plan_id' => DefaultPlan::id(),
            'price' => 12000,
        ]);
        SupplierProduct::factory()->for($this->product)->create(['price' => 10000]);
        $this->balanceChannel = PaymentChannel::factory()->balance()->create();
    }

    private function member(int $balance = 100000, int $points = 0, ?MembershipPlan $plan = null): User
    {
        $role = Role::factory()->create(['name' => 'Member']);
        $user = User::factory()->create([
            'role_id' => $role->id,
            'balance' => $balance,
            'point' => $points,
            'membership_plan_id' => $plan?->id,
        ]);
        Sanctum::actingAs($user, ['access-api']);

        return $user;
    }

    private function checkout(array $extra = []): TestResponse
    {
        return $this->postJson('/api/v1/checkout', array_merge([
            'product_id' => $this->product->id,
            'payment_channel_id' => $this->balanceChannel->id,
            'target_uid' => '12345678',
            'email' => 'buyer@example.com',
        ], $extra));
    }

    public function test_points_cover_part_of_the_order_and_the_wallet_pays_the_rest(): void
    {
        $user = $this->member(balance: 100000, points: 2000);

        $this->checkout(['points_to_spend' => 2000])->assertCreated();

        $transaction = Transaction::first();

        $this->assertSame(2000, (int) $transaction->points_spent);
        $this->assertSame(2000, (int) $transaction->points_spent_amount);
        // Fees follow the reduced price — the customer pays the fee on what
        // they are actually charged.
        $this->assertSame(10000, (int) $transaction->amount_base);
        $this->assertSame(0, (int) $user->fresh()->point);
        $this->assertSame(100000 - 10000, (int) $user->fresh()->balance);
    }

    public function test_points_can_cover_the_whole_order(): void
    {
        $user = $this->member(balance: 0, points: 12000);

        $this->checkout(['points_to_spend' => 12000])->assertCreated();

        $transaction = Transaction::first();
        $payment = Payment::first();

        $this->assertSame(0, (int) $transaction->amount_total);
        // The payment row must exist even at zero: `InitiateRefundAction` stops
        // at `! $payment`, so without it a points-paid order could never be
        // refunded.
        $this->assertNotNull($payment);
        $this->assertSame(0, (int) $payment->gross_amount);
        // And the wallet was never touched — WalletLedger throws on a zero
        // mutation, so an unguarded call would crash exactly here.
        $this->assertSame(0, (int) $user->fresh()->balance);
        $this->assertSame(1, PointLedgerEntry::where('type', 'spend')->count());
    }

    public function test_a_full_points_order_ignores_the_channel_minimum(): void
    {
        // The min-amount guard has nothing to apply to when nothing is owed;
        // without the exemption it rejects the very redemption this allows.
        $this->balanceChannel->update(['min_amount' => 10000]);
        $this->member(balance: 0, points: 12000);

        $this->checkout(['points_to_spend' => 12000])->assertCreated();
    }

    public function test_spending_more_points_than_the_order_is_worth_is_capped(): void
    {
        $user = $this->member(balance: 0, points: 50000);

        $this->checkout(['points_to_spend' => 50000])->assertCreated();

        // Only what the order was worth — never overpay into a credit note.
        $this->assertSame(12000, (int) Transaction::first()->points_spent);
        $this->assertSame(38000, (int) $user->fresh()->point);
    }

    public function test_spending_more_points_than_the_member_holds_is_refused(): void
    {
        $user = $this->member(balance: 100000, points: 500);

        $this->checkout(['points_to_spend' => 2000])->assertStatus(400);

        $this->assertSame(500, (int) $user->fresh()->point);
        $this->assertSame(0, Transaction::count());
    }

    public function test_a_plan_that_bars_points_refuses_the_redemption(): void
    {
        // A plan that already buys a discount does not also get to spend points.
        $plan = MembershipPlan::create([
            'code' => 'gold',
            'name' => ['id' => 'Gold'],
            'price' => 300000,
            'duration_days' => null,
            'is_active' => true,
            'allows_point_spending' => false,
            'sort_order' => 3,
        ]);

        $user = $this->member(balance: 100000, points: 5000, plan: $plan);

        $this->checkout(['points_to_spend' => 2000])->assertStatus(400);

        $this->assertSame(5000, (int) $user->fresh()->point);
    }

    public function test_a_guest_cannot_spend_points(): void
    {
        $this->postJson('/api/v1/checkout', [
            'product_id' => $this->product->id,
            'payment_channel_id' => PaymentChannel::factory()->create()->id,
            'target_uid' => '12345678',
            'email' => 'guest@example.com',
            'guest_contact' => '+6281234567890',
            'points_to_spend' => 1000,
        ])->assertStatus(400);
    }

    /**
     * The number the storefront quotes and the number the customer is actually
     * granted must be the same number.
     *
     * This is the only test that puts checkout and the grant end to end, and it
     * is here because the unit test alone could not catch the double deduction:
     * it built its own fixture, so it never had to agree with what checkout
     * writes. Redeeming points is what makes the two diverge, so this case
     * redeems some.
     */
    public function test_the_points_granted_match_the_base_checkout_stored(): void
    {
        Setting::create([
            'group' => 'points', 'key' => 'earn_percent', 'value' => '2',
            'type' => 'number', 'label' => 'Earn %', 'is_public' => true,
        ]);
        $user = $this->member(balance: 100000, points: 2000);

        $this->checkout(['points_to_spend' => 2000])->assertCreated();

        $transaction = Transaction::first();
        $transaction->update(['status' => TransactionStatus::COMPLETED]);

        app(GrantTransactionPointsAction::class)->execute($transaction);

        // 12.000 price - 2.000 paid in points = 10.000 cash, at 2% = 200.
        $expected = PointRules::earnedFor($this->product, (int) $transaction->amount_base);

        $this->assertSame(200, $expected, 'The rule itself must earn on the stored base.');
        $this->assertSame($expected, (int) $transaction->fresh()->points_earned);
        // The spent points are gone and the earned ones have landed.
        $this->assertSame($expected, (int) $user->fresh()->point);
    }
}
