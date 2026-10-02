<?php

declare(strict_types=1);

namespace App\Actions\Refund;

use App\Contracts\RefundClaimChannel;
use App\Models\RefundRequest;
use App\Services\DiscordWebhookService;
use App\Support\Integration\AdapterResolver;
use App\Support\PublicUrl;
use Illuminate\Support\Facades\Log;

/**
 * Tells a guest their money is waiting and where to claim it.
 *
 * The CHANNELS are a list (`config('notifications.refund_claim')`), not a
 * decision this class makes: email ships on, WhatsApp is part of the future
 * subscription and ships off, so its queued send is a no-op until it is switched
 * on (`PiWapiService::canSend()`). **Email is the only channel that carries a
 * link right now.**
 *
 * The plaintext claim token is a parameter, never read back from the row — the
 * row only holds its hash. That means this action is the *only* place the link
 * can be built, and re-sending requires re-issuing the token.
 *
 * `claim_notified_at` is the idempotency guard, mirroring `receipt_sent_at` in
 * SendTransactionReceiptAction. It is stamped optimistically after queueing, for
 * the same reason: a duplicate refund email is a worse failure than a missed one
 * is here, because the customer already has the link. Unlike the receipt seam,
 * this stamp belongs to the FLOW, not to a channel: one refund, one
 * notification, however many channels carry it.
 *
 * **An unreachable storefront URL stops the send.** A claim link is delivered
 * once, to someone owed money, and every layer here reports success whatever the
 * link says — so a `http://localhost:5173/...` was invisible from this side and
 * total for the customer. Refusing to send leaves `claim_notified_at` null,
 * which the refunds page already renders as "never notified — contact
 * manually": a state an operator can act on, unlike a stamped row holding a dead
 * link. It never throws — `InitiateRefundAction` calls this post-commit, where
 * nothing may fail the refund.
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

        foreach (AdapterResolver::resolveAll(RefundClaimChannel::class, (array) config('notifications.refund_claim', [])) as $channel) {
            // Deliberately not short-circuiting: a channel with no recipient must
            // not stop the next one from sending.
            $sent = $channel->send($refund, $claimUrl, $locale) || $sent;
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
