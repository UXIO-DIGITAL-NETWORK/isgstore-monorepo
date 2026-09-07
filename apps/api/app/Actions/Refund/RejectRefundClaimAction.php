<?php

declare(strict_types=1);

namespace App\Actions\Refund;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Enums\RefundMethod;
use App\Enums\RefundStatus;
use App\Models\RefundRequest;
use App\Models\User;
use App\Support\Refund\RefundClaimToken;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

/**
 * Refuses the *account* that claimed a refund, without refusing the refund.
 *
 * The distinction is the whole point, and it is a money distinction rather than
 * a wording one. `RejectRefundRequestAction` says "we do not owe you this" and
 * is terminal. This says "we still owe you this, but not to that account" — the
 * money never left, the buyer is still entitled to it, and a mismatched or
 * suspicious claim must not bury their refund permanently.
 *
 * It would, if the two were one verb: `refund_requests.transaction_id` is
 * unique, so a rejected refund can never be re-opened by
 * `InitiateRefundAction` — it just hands back the same REJECTED row while
 * `RefundEligibility` cheerfully reports the transaction as refundable again.
 * Under the retired scheme rejection was rare enough for that to stay theory.
 * Under this one, turning away bad claims is routine.
 *
 * So the row goes back to WAITING_ACCOUNT with a **fresh token, sent to the
 * contact on the order** — never to the account that was just refused.
 */
class RejectRefundClaimAction
{
    public function __construct(
        private readonly CreateActivityLogAction $activityLogAction,
        private readonly SendRefundClaimNotificationAction $claimNotification,
    ) {}

    public function execute(RefundRequest $refund, User $admin, string $reason): RefundRequest
    {
        $plain = null;

        $fresh = DB::transaction(function () use ($refund, $reason, &$plain) {
            /** @var RefundRequest $locked */
            $locked = RefundRequest::whereKey($refund->getKey())->lockForUpdate()->firstOrFail();

            if ($locked->method !== RefundMethod::BALANCE_CLAIM) {
                throw new RuntimeException('Hanya klaim akun yang bisa ditolak dengan cara ini.');
            }

            if ($locked->status->isTerminal()) {
                throw new RuntimeException('Refund ini sudah diselesaikan atau ditolak.');
            }

            if ($locked->claimed_user_id === null) {
                throw new RuntimeException('Refund ini belum diklaim dengan sebuah akun.');
            }

            if ($locked->refunded_at !== null) {
                throw new RuntimeException('Refund ini sudah dibayarkan.');
            }

            [$plain, $hash] = RefundClaimToken::generate();

            $locked->forceFill([
                // Detach the refused account completely. Leaving `user_id` set
                // would make the refund look claimed on every list and let a
                // later `complete` credit the account we just turned away.
                'user_id' => null,
                'claimed_user_id' => null,
                'claimed_at' => null,
                'claimed_contact_match' => null,
                'claimed_contact_value' => null,
                // The clock is the customer's again, not ours.
                'verify_due_at' => null,
                'status' => RefundStatus::WAITING_ACCOUNT,
                'reject_reason' => $reason,
                'claim_rejected_count' => (int) $locked->claim_rejected_count + 1,
                // Release the row so any admin can pick up the next claim.
                'processed_by' => null,
                'processed_at' => null,
                // A brand new credential; the one the refused claimant used (if
                // they still have it) is already dead, cleared at claim time.
                'claim_token_hash' => $hash,
                'claim_expires_at' => now()->addDays(RefundClaimToken::TTL_DAYS),
                // Force the re-notification below past its idempotency guard.
                'claim_notified_at' => null,
            ])->save();

            return $locked->fresh();
        });

        // ── Post-commit: the customer still has money waiting, so tell them. ──
        if ($plain !== null) {
            try {
                $this->claimNotification->execute($fresh, $plain, force: true);
            } catch (Throwable $e) {
                // The rejection stands either way; an unreachable customer is a
                // row for an admin to chase, not a failed action.
                Log::warning("Refund claim re-notify failed for {$fresh->refund_number}: {$e->getMessage()}");
            }
        }

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: $admin->id,
            ipAddress: request()->ip() ?? '127.0.0.1',
            userAgent: request()->userAgent(),
            message: "Admin menolak klaim akun pada refund {$fresh->refund_number} — Alasan: {$reason}",
            transactionId: $fresh->transaction_id,
        ));

        return $fresh;
    }
}
