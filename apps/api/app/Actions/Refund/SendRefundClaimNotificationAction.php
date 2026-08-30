<?php

declare(strict_types=1);

namespace App\Actions\Refund;

use App\Jobs\SendRefundWhatsAppJob;
use App\Mail\RefundMail;
use App\Models\RefundRequest;
use App\Support\Phone;
use Illuminate\Support\Facades\Mail;

/**
 * Tells a guest their money is waiting and where to claim it, over two
 * independent channels: email and WhatsApp.
 *
 * The plaintext claim token is a parameter, never read back from the row — the
 * row only holds its hash. That means this action is the *only* place the link
 * can be built, and re-sending requires re-issuing the token.
 *
 * `claim_notified_at` is the idempotency guard, mirroring `receipt_sent_at` in
 * SendTransactionReceiptAction. It is stamped optimistically after queueing,
 * for the same reason: a duplicate refund email is a worse failure than a
 * missed one is here, because the customer already has the link.
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

    /** The public claim page, on the storefront, in the buyer's language. */
    private function claimUrl(string $claimToken, string $locale): string
    {
        $storeUrl = rtrim((string) config('services.storefront.url'), '/');

        return $storeUrl.'/'.$locale.'/refund?token='.urlencode($claimToken);
    }

    private function resolveLocale(RefundRequest $refund): string
    {
        $locale = $refund->transaction?->locale;

        return in_array($locale, ['id', 'en'], true) ? $locale : 'id';
    }
}
