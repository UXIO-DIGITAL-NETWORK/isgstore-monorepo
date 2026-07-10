<?php

namespace App\Actions\Payment;

use App\Enums\PaymentStatus;
use App\Jobs\RefundGatewayJob;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Refund a settled payment whose order failed at the provider (FAILED_PROVIDER).
 *
 * Idempotent and context-free: safe to call from a webhook handler OR from a
 * queue worker's failed() hook (no HTTP request context is assumed). The payment
 * row is locked FOR UPDATE and only refunded when its status is still '3' (Success),
 * so repeated calls credit the wallet / request the gateway refund exactly once.
 *
 *   - Balance channel  → restore the wallet balance inline (atomic DB op).
 *   - External channel → dispatch RefundGatewayJob AFTER commit, so the Monetapay
 *                        HTTP call gets queue retries and no row lock spans it.
 */
class RefundFailedTransactionAction
{
    public function execute(Transaction $transaction): void
    {
        // Payment needing an external gateway refund, captured for after-commit.
        $gatewayRefund = null;

        DB::transaction(function () use ($transaction, &$gatewayRefund) {
            // Re-load with a row lock so concurrent callers block until commit.
            $locked = Transaction::with(['payment', 'paymentChannel', 'user'])
                ->whereKey($transaction->getKey())
                ->lockForUpdate()
                ->first();

            if (! $locked) {
                return;
            }

            $payment = $locked->payment;

            // Only refund a payment that was actually settled and not already refunded.
            if (! $payment || $payment->status !== PaymentStatus::SUCCESS) {
                return;
            }

            // Internal wallet: restore the deducted balance to the member inline.
            // The user row is locked FOR UPDATE so concurrent refunds/checkouts
            // can't interleave and lose an increment.
            if ($locked->paymentChannel?->channel_code === 'balance') {
                $user = $locked->user_id
                    ? User::whereKey($locked->user_id)->lockForUpdate()->first()
                    : null;

                if ($user) {
                    $user->increment('balance', $payment->gross_amount);
                    $payment->update(['status' => PaymentStatus::REFUNDED]);
                    Log::info("Auto-refund (wallet): Rp {$payment->gross_amount} restored to User {$locked->user_id} for {$locked->invoice_number}");
                }

                return;
            }

            // External gateway: needs an HTTP call, so defer to after commit.
            if (! $payment->pg_transaction_id) {
                Log::warning("Auto-refund skipped: no gateway order id for {$locked->invoice_number}. Manual refund required.");

                return;
            }

            $gatewayRefund = $payment;
        });

        // ── Post-commit: queue the gateway refund (retryable, no lock held) ──
        if ($gatewayRefund !== null) {
            RefundGatewayJob::dispatch($gatewayRefund);
        }
    }
}
