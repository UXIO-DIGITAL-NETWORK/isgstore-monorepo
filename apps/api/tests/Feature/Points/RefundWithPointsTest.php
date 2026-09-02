<?php

namespace Tests\Feature\Points;

use App\Actions\Points\GrantTransactionPointsAction;
use App\Actions\Refund\InitiateRefundAction;
use App\Enums\PaymentStatus;
use App\Enums\TransactionStatus;
use App\Models\BalanceMutation;
use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\PointLedgerEntry;
use App\Models\Product;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use App\Support\Points\PointLedger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Refunding an order that used points. The rule: points come back as points and
 * only the rupiah remainder as balance — converting them would turn a
 * deliberately failed purchase into a way to cash points out.
 */
class RefundWithPointsTest extends TestCase
{
    use RefreshDatabase;

    private function member(int $points = 0, int $balance = 0): User
    {
        $role = Role::factory()->create(['name' => 'Member']);

        return User::factory()->create(['role_id' => $role->id, 'point' => $points, 'balance' => $balance]);
    }

    /** @return array{0: Transaction, 1: Payment} */
    private function paidOrder(User $user, int $cash, int $pointsSpent): array
    {
        $channel = PaymentChannel::factory()->create();
        $product = Product::factory()->create(['point_percent' => 2]);

        $transaction = Transaction::factory()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'payment_channel_id' => $channel->id,
            'status' => TransactionStatus::FAILED_PROVIDER->value,
            'amount_base' => $cash + $pointsSpent,
            'points_spent' => $pointsSpent,
            'points_spent_amount' => $pointsSpent,
        ]);

        $payment = Payment::factory()->create([
            'transaction_id' => $transaction->id,
            'payment_channel_id' => $channel->id,
            'gross_amount' => $cash,
            'status' => PaymentStatus::SUCCESS->value,
        ]);

        return [$transaction, $payment];
    }

    public function test_points_come_back_as_points_and_cash_as_balance(): void
    {
        $user = $this->member(points: 0, balance: 0);
        [$transaction] = $this->paidOrder($user, cash: 5000, pointsSpent: 20000);

        app(InitiateRefundAction::class)->execute($transaction);

        $this->assertSame(20000, (int) $user->fresh()->point, 'Points return as points.');
        $this->assertSame(5000, (int) $user->fresh()->balance, 'Only the rupiah remainder is cash.');
        $this->assertSame(20000, (int) $transaction->refundRequest?->points_amount ?? 0);
    }

    public function test_a_fully_points_paid_order_refunds_without_touching_the_wallet(): void
    {
        // `gross_amount` is zero here, and WalletLedger refuses a zero mutation
        // — an unguarded call crashes on exactly this order.
        $user = $this->member();
        [$transaction] = $this->paidOrder($user, cash: 0, pointsSpent: 12000);

        app(InitiateRefundAction::class)->execute($transaction);

        $this->assertSame(12000, (int) $user->fresh()->point);
        $this->assertSame(0, (int) $user->fresh()->balance);
        $this->assertSame(0, BalanceMutation::count(), 'No cash moved, so no wallet line.');
    }

    public function test_refunding_twice_returns_the_points_once(): void
    {
        $user = $this->member();
        [$transaction] = $this->paidOrder($user, cash: 5000, pointsSpent: 20000);

        $action = app(InitiateRefundAction::class);
        $action->execute($transaction);
        $action->execute($transaction->fresh());

        $this->assertSame(20000, (int) $user->fresh()->point);
        $this->assertSame(1, PointLedgerEntry::where('type', 'refund_return')->count());
    }

    public function test_a_goodwill_refund_claws_back_the_points_the_order_earned(): void
    {
        // Reachable because RefundEligibility checks the *payment* status: an
        // admin can refund an order the supplier already delivered.
        Mail::fake();

        $user = $this->member();
        [$transaction] = $this->paidOrder($user, cash: 100000, pointsSpent: 0);
        $transaction->update(['status' => TransactionStatus::COMPLETED->value]);

        app(GrantTransactionPointsAction::class)->execute($transaction->fresh());
        $this->assertSame(2000, (int) $user->fresh()->point);

        app(InitiateRefundAction::class)->execute($transaction->fresh());

        $this->assertSame(0, (int) $user->fresh()->point);
        $this->assertSame(1, PointLedgerEntry::where('type', 'earn_reversal')->count());
    }

    public function test_the_clawback_never_pushes_the_balance_negative(): void
    {
        // If the customer already spent them, the shortfall is logged rather
        // than left as a negative balance that silently eats future earnings.
        Mail::fake();

        $user = $this->member();
        [$transaction] = $this->paidOrder($user, cash: 100000, pointsSpent: 0);
        $transaction->update(['status' => TransactionStatus::COMPLETED->value]);

        app(GrantTransactionPointsAction::class)->execute($transaction->fresh());

        // The customer spends most of them elsewhere.
        PointLedger::record(user: $user->id, amount: -1500, type: 'spend', reference: 'OTHER');
        $this->assertSame(500, (int) $user->fresh()->point);

        app(InitiateRefundAction::class)->execute($transaction->fresh());

        $this->assertSame(0, (int) $user->fresh()->point, 'Clawed back to zero, never below.');
    }
}
