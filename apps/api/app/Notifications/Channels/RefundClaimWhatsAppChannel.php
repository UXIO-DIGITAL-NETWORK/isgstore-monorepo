<?php

declare(strict_types=1);

namespace App\Notifications\Channels;

use App\Contracts\RefundClaimChannel;
use App\Jobs\SendRefundWhatsAppJob;
use App\Models\RefundRequest;
use App\Support\Phone;

/**
 * The same claim link over WhatsApp. Ships off (PiWapiService::canSend()), so
 * the queued job is a no-op until it is switched on — the flow's own
 * `claim_notified_at` stamp is what keeps it from re-sending history later.
 */
class RefundClaimWhatsAppChannel implements RefundClaimChannel
{
    public function send(RefundRequest $refund, string $claimUrl, string $locale): bool
    {
        $recipient = Phone::toE164($refund->contact_phone);

        if ($recipient === null) {
            return false;
        }

        SendRefundWhatsAppJob::dispatch($recipient, __('refund.wa_claim', [
            'brand' => (string) config('services.storefront.brand', 'TOPUP GAME'),
            'invoice' => $refund->transaction?->invoice_number ?? $refund->refund_number,
            'amount' => 'Rp '.number_format((int) $refund->amount, 0, ',', '.'),
            'url' => $claimUrl,
        ], $locale));

        return true;
    }
}
