<?php

namespace App\Actions\Payment;

use App\Models\Payment;
use App\Models\Transaction;
use App\Services\Payment\MonetapayService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Refund a settled payment whose order failed at the provider (FAILED_PROVIDER).
 *
 * Idempotent and context-free: safe to call from a webhook handler OR from a
 * queue worker's failed() hook (no HTTP request context is assumed). The payment
 * row is locked FOR UPDATE and only refunded when its status is still '3' (Success),
 * so repeated calls credit the wallet / request the gateway refund exactly once.
 *
 *   - Balance channel  → restore the wallet balance inline (atomic DB op).
 *   - External channel → defer the Monetapay refund HTTP call until AFTER commit,
 *                        so a row lock is never held across a network call.
 */
class RefundFailedTransactionAction
{
    public function __construct(
        private readonly MonetapayService $monetapayService,
    ) {}

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
            if (! $payment || $payment->status !== '3') {
                return;
            }

            // Internal wallet: restore the deducted balance to the member inline.
            if ($locked->paymentChannel?->channel_code === 'balance') {
                if ($locked->user) {
                    $locked->user->increment('balance', $payment->gross_amount);
                    $payment->update(['status' => '4']); // 4: Refunded
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

        // ── Post-commit side effect: gateway refund (no DB lock held) ────────
        if ($gatewayRefund !== null) {
            $this->processGatewayRefund($gatewayRefund);
        }
    }

    /**
     * Request a refund back to the original payment method via Monetapay.
     * A failure here is logged for manual follow-up rather than rolling back the
     * already-finalised FAILED_PROVIDER status.
     */
    private function processGatewayRefund(Payment $payment): void
    {
        try {
            $this->monetapayService->refundTransaction([
                'app_id' => config('services.monetapay.mch_id'),
                'refund_mch_order_no' => 'RFD-'.$payment->reference_id,
                'payment_order_no' => $payment->pg_transaction_id,
                'amount' => (string) $payment->gross_amount,
                'reason' => 'Auto-refund: Digiflazz order failed',
            ]);

            $payment->update(['status' => '4']); // 4: Refunded
            Log::info("Auto-refund (gateway): Monetapay refund requested Rp {$payment->gross_amount} for payment {$payment->reference_id}");
        } catch (Throwable $e) {
            Log::error("Auto-refund (gateway) failed for payment {$payment->reference_id}: {$e->getMessage()}");
        }
    }
}
