<?php

declare(strict_types=1);

namespace App\Actions\Refund;

use App\Jobs\SendRefundWhatsAppJob;
use App\Mail\RefundMail;
use App\Models\RefundRequest;
use App\Services\DiscordWebhookService;
use App\Support\Phone;
use App\Support\PublicUrl;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Tells a guest their money is waiting and where to claim it, over email and
 * WhatsApp. WhatsApp is part of the future subscription and ships off, so the
 * send it queues is a no-op until it is switched on (`PiWapiService::canSend()`);
 * **email is the only channel that carries a link right now.**
 *
 * The plaintext claim token is a parameter, never read back from the row — the
 * row only holds its hash. That means this action is the *only* place the link
 * can be built, and re-sending requires re-issuing the token.
 *
 * `claim_notified_at` is the idempotency guard, mirroring `receipt_sent_at` in
 * SendTransactionReceiptAction. It is stamped optimistically after queueing,
 * for the same reason: a duplicate refund email is a worse failure than a
 * missed one is here, because the customer already has the link.
 *
 * **An unreachable storefront URL stops the send.** A claim link is delivered
 * once, to someone owed money, and every layer here reports success whatever
 * the link says — so a `http://localhost:5173/...` was invisible from this side
 * and total for the customer. Refusing to send leaves `claim_notified_at` null,
 * which the refunds page already renders as "never notified — contact
 * manually": a state an operator can act on, unlike a stamped row holding a
 * dead link. It never throws — `InitiateRefundAction` calls this post-commit,
 * where nothing may fail the refund.
 */
class SendRefundClaimNotificationAction
{
    public function execute(RefundRequest $refund, string $claimToken, bool $force = false): bool
    {
        if (! $force && $refund->claim_notified_at !== null) {
            return false;
        }

        $refund->loadMissing('transaction');
        $locale = $this->resolveLocale($refund);
        $claimUrl = $this->claimUrl($claimToken, $locale);

        if ($claimUrl === null) {
            // Loud on both channels an operator watches, because a bad base URL
            // is never one refund's problem — it is every refund's.
            $message = 'STOREFRONT_URL is missing or not publicly reachable, so refund claim links are not being '
                ."sent — most recently {$refund->refund_number}. Set it to the live storefront domain, then re-send "
                .'the affected refunds from the refunds page.';

            // The log line stays per-refund: that is the record of which ones
            // need re-sending. The alert does not — this is one broken config,
            // and reporting it per row is what buried the message that actually
            // needed a human.
            Log::error($message, ['refund_id' => $refund->id, 'configured' => config('services.storefront.url')]);
            app(DiscordWebhookService::class)->sendAlertOnce('storefront-url-unreachable', $message);

            return false;
        }

        $sent = false;

        if ($refund->contact_email) {
            Mail::to($refund->contact_email)
                ->locale($locale)
                ->queue(new RefundMail($refund, $locale, RefundMail::VARIANT_CLAIM, $claimUrl));

            $sent = true;
        }

        $recipient = Phone::toE164($refund->contact_phone);
        if ($recipient !== null) {
            SendRefundWhatsAppJob::dispatch($recipient, __('refund.wa_claim', [
                'brand' => (string) config('services.storefront.brand', 'TOPUP GAME'),
                'invoice' => $refund->transaction?->invoice_number ?? $refund->refund_number,
                'amount' => 'Rp '.number_format((int) $refund->amount, 0, ',', '.'),
                'url' => $claimUrl,
            ], $locale));

            $sent = true;
        }

        // A refund with no reachable contact is not an error — it is a row the
        // admin has to chase by hand. Leaving the timestamp null keeps it
        // visible as "never notified" on the refund page.
        if ($sent) {
            $refund->forceFill(['claim_notified_at' => now()])->save();
        }

        return $sent;
    }

    /**
     * The public claim page, on the storefront, in the buyer's language.
     *
     * Null when the storefront base is not an address the customer could open —
     * see the class docblock for why that stops the send rather than producing
     * a link that fails only for them.
     */
    private function claimUrl(string $claimToken, string $locale): ?string
    {
        $storeUrl = PublicUrl::storefront();

        if ($storeUrl === null) {
            return null;
        }

        return $storeUrl.'/'.$locale.'/refund?token='.urlencode($claimToken);
    }

    private function resolveLocale(RefundRequest $refund): string
    {
        $locale = $refund->transaction?->locale;

        return in_array($locale, ['id', 'en'], true) ? $locale : 'id';
    }
}
