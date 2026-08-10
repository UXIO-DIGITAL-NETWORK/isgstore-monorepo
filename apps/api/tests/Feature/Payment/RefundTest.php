<?php

namespace Tests\Feature\Payment;

use App\Actions\Payment\RefundFailedTransactionAction;
use App\Enums\PaymentStatus;
use App\Jobs\RefundGatewayJob;
use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use App\Services\Payment\MonetapayService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class RefundTest extends TestCase
{
    use RefreshDatabase;

    private function makePaidTransaction(PaymentChannel $channel, ?User $user, ?string $pgTransactionId = null): Transaction
    {
        $transaction = Transaction::factory()->create([
            'user_id' => $user?->id,
            'payment_channel_id' => $channel->id,
            'status' => 'FAILED_PROVIDER',
        ]);

        Payment::factory()->create([
            'transaction_id' => $transaction->id,
            'payment_channel_id' => $channel->id,
            'gross_amount' => 12000,
            'pg_transaction_id' => $pgTransactionId,
            'status' => '3',
        ]);

        return $transaction;
    }

    public function test_wallet_refund_credits_balance_exactly_once_when_called_twice(): void
    {
        $role = Role::factory()->create();
        $user = User::factory()->create(['role_id' => $role->id, 'balance' => 5000]);
        $channel = PaymentChannel::factory()->balance()->create();
        $transaction = $this->makePaidTransaction($channel, $user);

        $action = app(RefundFailedTransactionAction::class);
        $action->execute($transaction);
        $action->execute($transaction);

        $this->assertSame(17000, $user->fresh()->balance);
        $this->assertSame(PaymentStatus::REFUNDED, $transaction->payment->fresh()->status);
    }

    public function test_gateway_refund_is_dispatched_as_retryable_job(): void
    {
        Queue::fake();

        $channel = PaymentChannel::factory()->create();
        $transaction = $this->makePaidTransaction($channel, null, pgTransactionId: 'PG-1');

        app(RefundFailedTransactionAction::class)->execute($transaction);

        Queue::assertPushed(RefundGatewayJob::class, 1);
    }

    public function test_gateway_refund_skipped_without_gateway_order_id(): void
    {
        Queue::fake();

        $channel = PaymentChannel::factory()->create();
        $transaction = $this->makePaidTransaction($channel, null, pgTransactionId: null);

        app(RefundFailedTransactionAction::class)->execute($transaction);

        // No gateway order id → the gateway refund job must not be dispatched.
        // (A status-change broadcast may still be queued — that is unrelated to
        // whether the gateway refund was attempted.)
        Queue::assertNotPushed(RefundGatewayJob::class);
    }

    public function test_refund_job_marks_payment_refunded_on_gateway_success(): void
    {
        Http::fake(['*monetapay*' => Http::response(['code' => 200, 'message' => 'success'])]);

        $channel = PaymentChannel::factory()->create();
        $transaction = $this->makePaidTransaction($channel, null, pgTransactionId: 'PG-1');
        $payment = $transaction->payment;

        (new RefundGatewayJob($payment))->handle(app(MonetapayService::class));

        $this->assertSame(PaymentStatus::REFUNDED, $payment->fresh()->status);
        Http::assertSentCount(1);
    }

    public function test_refund_job_noops_on_already_refunded_payment(): void
    {
        Http::fake();

        $channel = PaymentChannel::factory()->create();
        $transaction = $this->makePaidTransaction($channel, null, pgTransactionId: 'PG-1');
        $payment = $transaction->payment;
        $payment->update(['status' => '4']);

        (new RefundGatewayJob($payment))->handle(app(MonetapayService::class));

        Http::assertNothingSent();
    }

    public function test_refund_job_throws_on_gateway_business_error_so_queue_retries(): void
    {
        Http::fake(['*monetapay*' => Http::response(['code' => 5001, 'message' => 'insufficient merchant balance'])]);

        $channel = PaymentChannel::factory()->create();
        $transaction = $this->makePaidTransaction($channel, null, pgTransactionId: 'PG-1');
        $payment = $transaction->payment;

        $this->expectExceptionMessage('Monetapay refund rejected');

        (new RefundGatewayJob($payment))->handle(app(MonetapayService::class));
    }
}
