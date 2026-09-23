<?php

declare(strict_types=1);

namespace App\Actions\Refund;

use App\Enums\RefundStatus;
use App\Models\RefundRequest;
use App\Models\Transaction;
use App\Support\Phone;
use App\Support\Refund\RefundClaimToken;
use Illuminate\Database\Eloquent\Builder;

/**
 * "I lost the email" — re-issues the claim link for a guest refund.
 *
 * **The response must be identical whether or not anything matched.** Handing
 * the token straight back on a match would turn this into an oracle: anyone
 * holding a leaked invoice number could probe email addresses until one
 * answered differently, and the prize is the ability to redirect a refund. The
 * link goes out of band instead — to the email already on the order (and
 * WhatsApp, once delivery is switched on) — which is the same reasoning
 * `forgot-password` uses in this codebase.
 *
 * Matching is invoice AND contact, both exact. `TrackOrdersAction` matches
 * invoice OR phone OR email because its output is a harmless projection; this
 * one grants control of money, so one identifier is not enough.
 *
 * Re-issuing rotates the token, so an old link in a forwarded email stops
 * working the moment a new one is requested. That rotation is also why there is
 * a cooldown: a `balance_claim` refund can sit unclaimed for months, and
 * without one, anyone holding the invoice and contact could rotate a victim's
 * live link indefinitely and keep them from ever claiming. The cooldown is
 * silent — the caller's response must stay identical either way.
 */
class ResendRefundClaimLinkAction
{
    /** How long a freshly sent link is protected from being rotated away. */
    private const ROTATION_COOLDOWN_MINUTES = 5;

    public function __construct(private readonly SendRefundClaimNotificationAction $notification) {}

    /**
     * @return bool Whether a link was actually sent. **Callers must not leak
     *              this to the client** — it is returned only for logging and
     *              tests.
     */
    public function execute(string $invoiceNumber, string $contact): bool
    {
        $refund = $this->find(trim($invoiceNumber), trim($contact));

        if (! $refund) {
            return false;
        }

        // Nothing to claim once the customer has done their part, or once an
        // admin is working it. `claimable()`, not `payoutEditable()`: the
        // latter omits WAITING_ACCOUNT, which would silently disable resend for
        // every refund opened under the current scheme.
        if (! in_array($refund->status, RefundStatus::claimable(), true)) {
            return false;
        }

        // Silently refuse a rotation that would only serve to kill a link the
        // customer received moments ago.
        if ($refund->claim_notified_at !== null && $refund->claim_notified_at->gt(now()->subMinutes(self::ROTATION_COOLDOWN_MINUTES))) {
            return false;
        }

        [$plain, $hash] = RefundClaimToken::generate();

        $refund->forceFill([
            'claim_token_hash' => $hash,
            'claim_expires_at' => now()->addDays(RefundClaimToken::TTL_DAYS),
        ])->save();

        return $this->notification->execute($refund, $plain, force: true);
    }

    private function find(string $invoiceNumber, string $contact): ?RefundRequest
    {
        if ($invoiceNumber === '' || $contact === '') {
            return null;
        }

        $transaction = Transaction::where('invoice_number', $invoiceNumber)->first();

        if (! $transaction) {
            return null;
        }

        $phones = Phone::candidates($contact);
        $email = filter_var($contact, FILTER_VALIDATE_EMAIL) ? strtolower($contact) : null;

        if ($phones === [] && $email === null) {
            return null;
        }

        return RefundRequest::query()
            ->where('transaction_id', $transaction->id)
            ->whereNotNull('claim_token_hash')
            ->where(function (Builder $q) use ($phones, $email) {
                if ($phones !== []) {
                    $q->orWhereIn('contact_phone', $phones);
                }

                if ($email !== null) {
                    // Case-insensitive exact match — emails are stored as typed.
                    $q->orWhereRaw('lower(contact_email) = ?', [$email]);
                }
            })
            ->first();
    }
}
