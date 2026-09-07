<?php

declare(strict_types=1);

namespace App\Actions\Refund;

use App\Actions\Notification\NotifyRoleAction;
use App\Enums\RefundMethod;
use App\Enums\RefundStatus;
use App\Enums\RoleType;
use App\Models\RefundRequest;
use App\Models\User;
use App\Services\DiscordWebhookService;
use App\Support\Refund\RefundContactMatcher;
use App\Support\Refund\RefundSla;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * A guest attaches an account to their refund, so the money can be credited as
 * balance instead of transferred to a bank.
 *
 * This action does **not** move money. It moves the refund from "waiting on the
 * customer" to "waiting on us", and records the evidence an admin needs to
 * decide whether to credit: which contact matched, what it said at the time,
 * and when the 2x24 working-hour promise falls due.
 *
 * Two credentials are required and neither is sufficient alone:
 *
 *  1. **The claim token**, already resolved by the caller. It is the bearer
 *     credential, delivered out of band to the contact on the order.
 *  2. **A matching contact.** Registration has no email verification, so an
 *     account's email is a self-assertion; paired with the token it is what
 *     stops a forwarded link from redirecting someone else's money.
 *
 * `transactions.user_id` is deliberately left alone. It drives merchant/member
 * attribution, `UnifiedTransactionQuery` and every report; rewriting it here
 * would retroactively move a guest sale into a member's history for a period
 * when that account did not exist. The claim lives on this table only — the
 * customer sees the money in their balance mutations and in the member area's
 * refund list.
 */
class ClaimRefundWithAccountAction
{
    public function __construct(
        private readonly NotifyRoleAction $notifyRole,
        private readonly DiscordWebhookService $discord,
    ) {}

    public function execute(RefundRequest $refund, User $user): RefundRequest
    {
        /** @var RefundRequest $claimed */
        $claimed = DB::transaction(function () use ($refund, $user) {
            $locked = RefundRequest::whereKey($refund->getKey())->lockForUpdate()->first();

            if (! $locked) {
                throw new RuntimeException('Pengembalian dana tidak ditemukan.');
            }

            if ($locked->method !== RefundMethod::BALANCE_CLAIM) {
                throw new RuntimeException('Pengembalian dana ini tidak dikembalikan sebagai saldo.');
            }

            // The status gate, not just a nicety: an admin may have rejected
            // this refund between the token being resolved and this write. The
            // row lock plus this check is what makes the two orderings agree.
            if ($locked->status !== RefundStatus::WAITING_ACCOUNT) {
                throw new RuntimeException($locked->claimed_user_id !== null
                    ? 'Pengembalian dana ini sudah diklaim dengan sebuah akun.'
                    : 'Pengembalian dana ini sudah tidak bisa diklaim.');
            }

            $match = RefundContactMatcher::match($locked, $user);

            if ($match === null) {
                throw new RuntimeException(
                    'Email atau nomor WhatsApp akun ini tidak cocok dengan data pemesanan. '
                    .'Gunakan akun dengan kontak yang sama seperti saat memesan.'
                );
            }

            $locked->forceFill([
                'user_id' => $user->id,
                'claimed_user_id' => $user->id,
                'claimed_at' => now(),
                'claimed_contact_match' => $match->field,
                'claimed_contact_value' => $match->value,
                'verify_due_at' => RefundSla::dueAt(),
                'status' => RefundStatus::PENDING,
                // The link has done its job. Leaving it live would let a
                // forwarded copy of the same email re-bind the refund to a
                // second account, and would keep `resend` rotating a credential
                // nobody needs any more.
                'claim_token_hash' => null,
                'claim_expires_at' => null,
            ])->save();

            return $locked;
        });

        // ── Post-commit: nothing here may fail a claim that already happened ──
        $this->announce($claimed);

        return $claimed;
    }

    private function announce(RefundRequest $refund): void
    {
        $refund->loadMissing('transaction');

        $invoice = $refund->transaction?->invoice_number ?? $refund->refund_number;
        $amount = 'Rp '.number_format((int) $refund->amount, 0, ',', '.');

        try {
            $this->notifyRole->execute(
                role: RoleType::ADMIN,
                type: 'refund.claimed',
                title: 'Klaim pengembalian dana baru',
                message: "Akun telah diklaim untuk {$invoice} sebesar {$amount}. Menunggu verifikasi.",
                data: [
                    'refund_number' => $refund->refund_number,
                    'invoice_number' => $invoice,
                    'amount' => (int) $refund->amount,
                    'verify_due_at' => $refund->verify_due_at?->toIso8601String(),
                ],
                // One notification per refund, however many times this runs.
                dedupeKey: "refund-claim:{$refund->refund_number}",
            );

            $this->discord->sendAlert(
                "Klaim pengembalian dana: {$refund->refund_number} — {$invoice} — {$amount}. "
                .'Jatuh tempo verifikasi: '.($refund->verify_due_at?->toDateTimeString() ?? '-')
            );
        } catch (\Throwable $e) {
            // A claim that succeeded must never be reported as failed because
            // an alert channel was down. The row is already in the queue.
            Log::warning("Refund claim announce failed for {$refund->refund_number}: {$e->getMessage()}");
        }
    }
}
