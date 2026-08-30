<?php

declare(strict_types=1);

namespace App\Actions\Refund;

use App\Actions\Settlement\ReverseMerchantSettlementAction;
use App\Enums\PaymentStatus;
use App\Enums\RefundMethod;
use App\Enums\RefundStatus;
use App\Enums\TransactionStatus;
use App\Models\RefundRequest;
use App\Models\Transaction;
use App\Models\User;
use App\Support\Refund\RefundClaimToken;
use App\Support\Wallet\WalletLedger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Open a refund for a settled payment whose order failed at the provider
 * (FAILED_PROVIDER). The single entry point for every refund in the system —
 * replaces the old RefundFailedTransactionAction and its gateway refund.
 *
 * Idempotent and context-free: safe from a webhook handler OR from a queue
 * worker's failed() hook (no HTTP request context is assumed). The transaction
 * row is locked FOR UPDATE, the payment must still be Success, and
 * `refund_requests.transaction_id` is unique — so the three racing callers
 * (uxiotopup webhook, status poll, `ProcessUxiotopupTopup::failed()`) open
 * exactly one refund between them.
 *
 * Two paths, chosen by whether the buyer had an account:
 *
 *   - **Member** → credited to `users.balance` immediately, through
 *     `WalletLedger` so it lands in `balance_mutations` as a `refund`. No admin
 *     approval; the money is spendable at the next checkout. Settles here, so
 *     the settlement reversal runs here too.
 *   - **Guest** → recorded as a manual-transfer refund and queued on the admin
 *     refund page. The customer supplies bank details on the public claim page;
 *     an admin transfers by hand and marks it complete. `payments.status` stays
 *     Success until then — the money has not moved, and the finance reports
 *     read that column as cash out.
 *
 * There is deliberately no automatic gateway refund any more. `POST
 * /v1/monetapay/refund` remains as a manual admin tool, outside this path.
 */
class InitiateRefundAction
{
    public function __construct(
        private readonly ReverseMerchantSettlementAction $reverseSettlement,
        private readonly SendRefundClaimNotificationAction $claimNotification,
    ) {}

    /** @return RefundRequest|null The refund, or null when there was nothing to refund. */
    public function execute(Transaction $transaction): ?RefundRequest
    {
        /** @var RefundRequest|null $created */
        $created = null;
        /** @var string|null $claimToken Plaintext, held only long enough to notify. */
        $claimToken = null;
        $settledInline = false;

        DB::transaction(function () use ($transaction, &$created, &$claimToken, &$settledInline) {
            // Re-load with a row lock so concurrent callers block until commit.
            $locked = Transaction::with(['payment', 'paymentChannel', 'user'])
                ->whereKey($transaction->getKey())
                ->lockForUpdate()
                ->first();

            if (! $locked) {
                return;
            }

            $payment = $locked->payment;

            // The primary money gate, unchanged from the old action: only a
            // payment that actually settled and has not been refunded.
            if (! $payment || $payment->status !== PaymentStatus::SUCCESS) {
                return;
            }

            // A refund already exists — a retried webhook, or the poll racing
            // the job's failed() hook. Hand back what is already there.
            $existing = RefundRequest::where('transaction_id', $locked->id)->lockForUpdate()->first();
            if ($existing) {
                $created = $existing;

                return;
            }

            $amount = (int) $payment->gross_amount;

            // Belt and braces. `transactions.user_id` is restrictOnDelete, so a
            // buyer's account cannot vanish under their own order and this
            // should always find the row. It is written as a fallback rather
            // than a firstOrFail() because the failure mode of guessing wrong
            // is the worst kind: WalletLedger would throw inside a webhook's
            // transaction, return a 500, and make the supplier redeliver
            // forever. Falling through to the manual queue degrades instead.
            $member = $locked->user_id
                ? User::whereKey($locked->user_id)->lockForUpdate()->first()
                : null;

            $base = [
                'transaction_id' => $locked->id,
                'payment_id' => $payment->id,
                'merchant_id' => $locked->merchant_id,
                'refund_number' => 'RFD-'.Str::lower(Str::random(12)),
                'amount' => $amount,
            ];

            if ($member) {
                $created = RefundRequest::create($base + [
                    'user_id' => $member->id,
                    'method' => RefundMethod::BALANCE,
                    'status' => RefundStatus::COMPLETED,
                    'contact_email' => $member->email ?? $locked->contact_email,
                    'contact_phone' => $member->phone ?? $locked->guest_contact,
                    'refunded_at' => now(),
                ]);

                // The ledger is the only sanctioned way users.balance moves; it
                // locks the user row itself, so concurrent refunds and
                // checkouts cannot interleave and lose an increment.
                WalletLedger::record(
                    user: $member->id,
                    amount: $amount,
                    type: 'refund',
                    reference: $locked->invoice_number,
                    description: "Refund {$locked->invoice_number}",
                );

                $payment->update(['status' => PaymentStatus::REFUNDED]);
                $locked->update(['status' => TransactionStatus::REFUNDED]);

                $settledInline = true;

                Log::info("Refund (saldo): Rp {$amount} credited to User {$member->id} for {$locked->invoice_number}");

                return;
            }

            // Guest (or an orphaned member): queue it for a manual transfer.
            // Nothing about the payment changes yet — the money is still ours
            // until an admin actually sends it.
            [$plain, $hash] = RefundClaimToken::generate();
            $claimToken = $plain;

            $created = RefundRequest::create($base + [
                'user_id' => null,
                'method' => RefundMethod::MANUAL_TRANSFER,
                'status' => RefundStatus::WAITING_DETAILS,
                'contact_email' => $locked->contact_email,
                'contact_phone' => $locked->guest_contact,
                'claim_token_hash' => $hash,
                'claim_expires_at' => now()->addDays(RefundClaimToken::TTL_DAYS),
            ]);

            Log::info("Refund (manual): Rp {$amount} queued as {$created->refund_number} for {$locked->invoice_number}");
        });

        // ── Post-commit: no lock held, and nothing here may fail the refund ──
        if ($created === null) {
            return null;
        }

        if ($settledInline) {
            // The member has been paid, so the merchant's credit for this sale
            // has to come off the books now. Never throws.
            $this->reverseSettlement->execute($created);
        }

        if ($claimToken !== null) {
            $this->claimNotification->execute($created, $claimToken);
        }

        return $created;
    }
}
