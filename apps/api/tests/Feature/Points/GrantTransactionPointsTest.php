<?php

namespace Tests\Feature\Points;

use App\Actions\Points\GrantTransactionPointsAction;
use App\Enums\TransactionStatus;
use App\Models\PointLedgerEntry;
use App\Models\Product;
use App\Models\Role;
use App\Models\Setting;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Points are granted only when an order is genuinely done — payment settled and
 * the supplier delivered. Getting the "exactly once" part wrong hands out money.
 */
class GrantTransactionPointsTest extends TestCase
{
    use RefreshDatabase;

    private function member(int $points = 0): User
    {
        $role = Role::factory()->create(['name' => 'Member']);

        return User::factory()->create(['role_id' => $role->id, 'point' => $points]);
    }

    private function order(?User $user, array $overrides = []): Transaction
    {
        $product = Product::factory()->create(array_merge([
            'point_percent' => 2,
            'point_flat' => null,
        ], $overrides['product'] ?? []));
        unset($overrides['product']);

        return Transaction::factory()->create(array_merge([
            'user_id' => $user?->id,
            'product_id' => $product->id,
            'status' => TransactionStatus::COMPLETED->value,
            'amount_base' => 100000,
            'points_spent' => 0,
            'points_spent_amount' => 0,
        ], $overrides));
    }

    public function test_a_completed_order_earns_the_products_percentage(): void
    {
        $user = $this->member();
        $transaction = $this->order($user);

        app(GrantTransactionPointsAction::class)->execute($transaction);

        $this->assertSame(2000, (int) $user->fresh()->point);
        $this->assertSame(2000, (int) $transaction->fresh()->points_earned);
    }

    public function test_percent_and_flat_are_additive(): void
    {
        // The percent scales with the sale; the flat is what makes a cheap
        // denomination worth anything at all.
        $user = $this->member();
        $transaction = $this->order($user, ['product' => ['point_percent' => 2, 'point_flat' => 50]]);

        app(GrantTransactionPointsAction::class)->execute($transaction);

        $this->assertSame(2050, (int) $user->fresh()->point);
    }

    public function test_an_unconfigured_product_falls_back_to_the_global_setting(): void
    {
        // A new SKU must not be silently worthless to the customer.
        Setting::create(['group' => 'points', 'key' => 'earn_percent', 'value' => '1', 'type' => 'number', 'label' => 'Earn %', 'is_public' => false]);

        $user = $this->member();
        $transaction = $this->order($user, ['product' => ['point_percent' => null, 'point_flat' => null]]);

        app(GrantTransactionPointsAction::class)->execute($transaction);

        $this->assertSame(1000, (int) $user->fresh()->point);
    }

    public function test_running_twice_grants_once(): void
    {
        // The unique (transaction_id, type) index is the guarantee; the
        // pre-check inside the action is only the fast path.
        $user = $this->member();
        $transaction = $this->order($user);

        $action = app(GrantTransactionPointsAction::class);
        $action->execute($transaction);
        $action->execute($transaction->fresh());

        $this->assertSame(2000, (int) $user->fresh()->point);
        $this->assertSame(1, PointLedgerEntry::where('type', 'earn')->count());
    }

    public function test_an_order_that_is_not_completed_earns_nothing(): void
    {
        $user = $this->member();
        $transaction = $this->order($user, ['status' => TransactionStatus::PROCESSING->value]);

        app(GrantTransactionPointsAction::class)->execute($transaction);

        $this->assertSame(0, (int) $user->fresh()->point);
    }

    public function test_a_guest_order_earns_nothing(): void
    {
        $transaction = $this->order(null);

        app(GrantTransactionPointsAction::class)->execute($transaction);

        $this->assertSame(0, PointLedgerEntry::count());
    }

    public function test_points_are_not_earned_on_the_part_paid_with_points(): void
    {
        // Otherwise a customer harvests points from points, forever.
        //
        // The fixture is shaped the way CheckoutAction actually writes one: it
        // subtracts the redeemed rupiah from the selling price BEFORE storing
        // `amount_base`, so a 100.000 order settled half in points is stored as
        // `amount_base` 50.000. An earlier version of this test set
        // `amount_base` to 100.000 alongside `points_spent_amount` 50.000 — a
        // row checkout can never produce — which is exactly why it kept passing
        // while the action deducted the points a second time.
        $user = $this->member();
        $transaction = $this->order($user, [
            'amount_base' => 50000,
            'points_spent' => 50000,
            'points_spent_amount' => 50000,
        ]);

        app(GrantTransactionPointsAction::class)->execute($transaction);

        $this->assertSame(1000, (int) $user->fresh()->point, '2% of the 50.000 actually paid in cash.');
    }
}
