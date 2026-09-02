<?php

namespace Tests\Feature\Refund;

use App\Actions\Refund\InitiateRefundAction;
use App\Enums\PaymentStatus;
use App\Enums\RefundMethod;
use App\Enums\RefundStatus;
use App\Enums\TransactionStatus;
use App\Mail\RefundMail;
use App\Models\BalanceMutation;
use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\RefundRequest;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * The two refund paths at the point they are opened: a member is credited
 * inline, a guest is queued for a manual transfer.
 */
class RefundInitiationTest extends TestCase
{
    use RefreshDatabase;

    private function member(int $balance = 0): User
    {
        // Explicit role: UserFactory's default role_id assumes seeded roles.
        $role = Role::factory()->create(['name' => 'Member']);

        return User::factory()->create(['role_id' => $role->id, 'balance' => $balance]);
    }

    private function paidTransaction(?User $user, int $gross = 12000): Transaction
    {
        $channel = PaymentChannel::factory()->create();

        $transaction = Transaction::factory()->create([
            'user_id' => $user?->id,
            'payment_channel_id' => $channel->id,
            'status' => TransactionStatus::FAILED_PROVIDER->value,
            'contact_email' => 'guest@example.com',
            'guest_contact' => '081234567890',
        ]);

        Payment::factory()->create([
            'transaction_id' => $transaction->id,
            'payment_channel_id' => $channel->id,
            'gross_amount' => $gross,
            'status' => PaymentStatus::SUCCESS->value,
        ]);

        return $transaction->fresh();
    }

    public function test_member_refund_credits_the_balance_and_writes_a_ledger_mutation(): void
    {
        $member = $this->member(balance: 5000);
        $transaction = $this->paidTransaction($member);

        $refund = app(InitiateRefundAction::class)->execute($transaction);

        $this->assertSame(RefundMethod::BALANCE, $refund->method);
        $this->assertSame(RefundStatus::COMPLETED, $refund->status);
        $this->assertSame(17000, (int) $member->fresh()->balance);

        // The blind spot in the old test: the balance moved but nothing proved
        // it went through the ledger, which is how the bypass survived.
        $mutation = BalanceMutation::where('user_id', $member->id)->where('type', 'refund')->first();
        $this->assertNotNull($mutation);
        $this->assertSame(12000, (int) $mutation->amount);
        $this->assertSame(5000, (int) $mutation->balance_before);
        $this->assertSame(17000, (int) $mutation->balance_after);
        $this->assertSame($transaction->invoice_number, $mutation->reference);
    }

    public function test_member_refund_marks_payment_and_transaction_refunded(): void
    {
        $member = $this->member();
        $transaction = $this->paidTransaction($member);

        app(InitiateRefundAction::class)->execute($transaction);

        $this->assertSame(PaymentStatus::REFUNDED, $transaction->payment->fresh()->status);
        $this->assertSame(TransactionStatus::REFUNDED, $transaction->fresh()->status);
    }

    public function test_refund_is_idempotent_when_two_callers_race(): void
    {
        $member = $this->member(balance: 5000);
        $transaction = $this->paidTransaction($member);

        $action = app(InitiateRefundAction::class);
        $action->execute($transaction);
        $action->execute($transaction);
        $action->execute($transaction->fresh());

        $this->assertSame(17000, (int) $member->fresh()->balance);
        $this->assertSame(1, RefundRequest::where('transaction_id', $transaction->id)->count());
        $this->assertSame(1, BalanceMutation::where('user_id', $member->id)->where('type', 'refund')->count());
    }

    public function test_guest_refund_is_queued_and_moves_no_money(): void
    {
        Mail::fake();

        $transaction = $this->paidTransaction(null);

        $refund = app(InitiateRefundAction::class)->execute($transaction);

        $this->assertSame(RefundMethod::BALANCE_CLAIM, $refund->method);
        $this->assertSame(RefundStatus::WAITING_ACCOUNT, $refund->status);
        // Nothing is owed to an account yet, and the SLA clock only starts when
        // the customer claims — an unclaimed refund must never read as late.
        $this->assertNull($refund->claimed_user_id);
        $this->assertNull($refund->verify_due_at);
        $this->assertNotNull($refund->claim_token_hash);
        $this->assertSame('guest@example.com', $refund->contact_email);
        $this->assertSame('081234567890', $refund->contact_phone);

        // The money has not moved, so the payment must still read as collected —
        // the finance reports sum status '4' as cash out.
        $this->assertSame(PaymentStatus::SUCCESS, $transaction->payment->fresh()->status);
        $this->assertSame(TransactionStatus::FAILED_PROVIDER, $transaction->fresh()->status);
        $this->assertSame(0, BalanceMutation::count());

        Mail::assertQueued(RefundMail::class);
    }

    public function test_no_gateway_refund_job_is_ever_dispatched(): void
    {
        // The class is gone; what has to stay true is that opening a refund
        // queues nothing that talks to the payment gateway. (It does queue the
        // customer's claim notification, which is the point of the flow.)
        Queue::fake();

        app(InitiateRefundAction::class)->execute($this->paidTransaction(null));

        foreach (Queue::pushedJobs() as $class => $jobs) {
            $this->assertStringNotContainsStringIgnoringCase('gateway', (string) $class);
            $this->assertStringNotContainsStringIgnoringCase('monetapay', (string) $class);
        }
    }

    public function test_refund_is_skipped_when_the_payment_never_succeeded(): void
    {
        $channel = PaymentChannel::factory()->create();
        $transaction = Transaction::factory()->create([
            'payment_channel_id' => $channel->id,
            'status' => TransactionStatus::EXPIRED->value,
        ]);
        Payment::factory()->create([
            'transaction_id' => $transaction->id,
            'payment_channel_id' => $channel->id,
            'status' => PaymentStatus::EXPIRED->value,
        ]);

        $this->assertNull(app(InitiateRefundAction::class)->execute($transaction));
        $this->assertSame(0, RefundRequest::count());
    }

    /**
     * Pins why InitiateRefundAction's "no wallet to credit" fallback is
     * unreachable rather than dead: `transactions.user_id` is restrictOnDelete,
     * so a buyer's account cannot disappear out from under their order. If that
     * constraint is ever loosened, this test fails first and the fallback stops
     * being theoretical.
     */
    public function test_a_member_with_orders_cannot_be_deleted_so_the_wallet_always_exists(): void
    {
        $member = $this->member();
        $this->paidTransaction($member);

        $this->expectException(QueryException::class);

        $member->delete();
    }
}
