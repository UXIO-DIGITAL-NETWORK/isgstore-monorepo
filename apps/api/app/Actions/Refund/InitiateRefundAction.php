<?php

declare(strict_types=1);

namespace App\Actions\Refund;

use App\Actions\Points\GrantTransactionPointsAction;
use App\Actions\Settlement\ReverseMerchantSettlementAction;
use App\Enums\PaymentStatus;
use App\Enums\RefundMethod;
use App\Enums\RefundStatus;
use App\Enums\TransactionStatus;
use App\Models\PointLedgerEntry;
use App\Models\RefundRequest;
use App\Models\Transaction;
use App\Models\User;
use App\Support\Points\PointLedger;
use App\Support\Refund\RefundClaimToken;
use App\Support\Wallet\WalletLedger;
use Illuminate\Database\QueryException;
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
 * (uxiolabs webhook, status poll, `ProcessUxiolabsTopup::failed()`) open
 * exactly one refund between them.
 *
 * Two paths, chosen by whether the buyer had an account:
 *
 *   - **Member** → credited to `users.balance` immediately, through
 *     `WalletLedger` so it lands in `balance_mutations` as a `refund`. No admin
 *     approval; the money is spendable at the next checkout. Settles here, so
 *     the settlement reversal runs here too.
 *   - **Guest** → recorded as a `balance_claim` refund in WAITING_ACCOUNT and
 *     queued on the admin refund page. There is no account to credit yet: the
 *     customer follows the emailed claim link, creates or signs in to an
 *     account whose contact matches the order, and an admin verifies it before
 *     the balance is credited. `payments.status` stays Success until that
 *     credit — the money has not moved, and the finance reports read that
 *     column as cash out.
 *
 * The retired guest path (`manual_transfer`, an admin transferring to a bank
 * account by hand) opens no new rows, but the ones still open are worked to
 * completion through the same queue.
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

            // Only the product itself is refunded. `amount_base` is the frozen
            // selling price the customer actually paid cash for — promo and
            // points already came off it — and it deliberately excludes the
            // channel fee: that fee bought a payment that really did happen,
            // and the gateway kept its cut of it either way.
            //
            // Points go back as points; only cash goes back as balance, or a
            // redemption would become a way to cash points out.
            $amount = (int) $locked->amount_base;
            $pointsBack = (int) $locked->points_spent;

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
                'points_amount' => $pointsBack,
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
                //
                // Guarded on zero: an order paid entirely with points owes no
                // cash back, and WalletLedger refuses a zero mutation.
                if ($amount > 0) {
                    WalletLedger::record(
                        user: $member->id,
                        amount: $amount,
                        type: 'refund',
                        reference: $locked->invoice_number,
                        description: "Refund {$locked->invoice_number}",
                    );
                }

                $this->returnPoints($locked, $member->id, $pointsBack);
                $this->reverseEarnedPoints($locked, $member->id);

                $payment->update(['status' => PaymentStatus::REFUNDED]);
                $locked->update(['status' => TransactionStatus::REFUNDED]);

                $settledInline = true;

                Log::info("Refund (saldo): Rp {$amount} credited to User {$member->id} for {$locked->invoice_number}");

                return;
            }

            // Guest (or an orphaned member): the money is owed, but there is
            // no account to credit yet. Nothing about the payment changes —
            // it is still ours until the credit actually happens.
            [$plain, $hash] = RefundClaimToken::generate();
            $claimToken = $plain;

            $created = RefundRequest::create($base + [
                'user_id' => null,
                'method' => RefundMethod::BALANCE_CLAIM,
                'status' => RefundStatus::WAITING_ACCOUNT,
                'contact_email' => $locked->contact_email,
                'contact_phone' => $locked->guest_contact,
                'claim_token_hash' => $hash,
                'claim_expires_at' => now()->addDays(RefundClaimToken::TTL_DAYS),
            ]);

            Log::info("Refund (claim): Rp {$amount} queued as {$created->refund_number} for {$locked->invoice_number}");
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

    /**
     * Give back the points the customer redeemed on this order.
     *
     * As points, not as cash: converting them would make a deliberately failed
     * purchase a way to turn points into rupiah.
     */
    private function returnPoints(Transaction $transaction, int $userId, int $points): void
    {
        if ($points <= 0) {
            return;
        }

        try {
            PointLedger::record(
                user: $userId,
                amount: $points,
                type: 'refund_return',
                transactionId: $transaction->id,
                reference: $transaction->invoice_number,
                description: "Poin dikembalikan {$transaction->invoice_number}",
            );
        } catch (QueryException) {
            // Unique (transaction_id, type) — already returned by a racing caller.
        }
    }

    /**
     * Take back points this order earned, when it earned any.
     *
     * Only reachable on a goodwill refund: points are granted at COMPLETED, and
     * `RefundEligibility` checks the *payment* status, so an admin can refund an
     * order the supplier already delivered.
     *
     * **Clawed back only as far as the balance allows, never into the negative.**
     * A negative point balance would silently swallow everything the customer
     * earns next with no explanation on screen; the shortfall is logged for
     * review instead.
     */
    private function reverseEarnedPoints(Transaction $transaction, int $userId): void
    {
        $earned = (int) PointLedgerEntry::query()
            ->where('transaction_id', $transaction->id)
            ->where('type', GrantTransactionPointsAction::TYPE)
            ->value('amount');

        if ($earned <= 0) {
            return;
        }

        $available = PointLedger::balanceFor($userId);
        $clawback = min($earned, $available);

        if ($clawback < $earned) {
            Log::warning(
                "Point clawback short on {$transaction->invoice_number}: "
                ."owed {$earned}, took {$clawback} (balance would have gone negative)."
            );
        }

        if ($clawback <= 0) {
            return;
        }

        try {
            PointLedger::record(
                user: $userId,
                amount: -$clawback,
                type: 'earn_reversal',
                transactionId: $transaction->id,
                reference: $transaction->invoice_number,
                description: "Pembatalan poin {$transaction->invoice_number}",
            );
        } catch (QueryException) {
            // Already reversed.
        }
    }
}
