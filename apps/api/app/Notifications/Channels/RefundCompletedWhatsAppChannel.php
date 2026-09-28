<?php

declare(strict_types=1);

namespace App\Notifications\Channels;

use App\Contracts\RefundCompletedChannel;
use App\Jobs\SendRefundWhatsAppJob;
use App\Models\RefundRequest;
use App\Support\Phone;

/**
 * "The transfer has been made", over WhatsApp. Ships off until the subscription
 * switches it on.
 */
class RefundCompletedWhatsAppChannel implements RefundCompletedChannel
{
    public function send(RefundRequest $refund, string $locale): bool
    {
        $recipient = Phone::toE164($refund->contact_phone);

        if ($recipient === null) {
            return false;
        }

        SendRefundWhatsAppJob::dispatch($recipient, __('refund.wa_done', [
            'brand' => (string) config('services.storefront.brand', 'TOPUP GAME'),
            'invoice' => $refund->transaction?->invoice_number ?? $refund->refund_number,
            'amount' => 'Rp '.number_format((int) $refund->amount, 0, ',', '.'),
            'destination' => $this->destination($refund),
        ], $locale));

        return true;
    }

    /** Masked: enough for the customer to recognise, useless to a forwarder. */
    private function destination(RefundRequest $refund): string
    {
        if (! $refund->bank_code) {
            return '-';
        }

        $number = (string) ($refund->account_number ?? $refund->account_phone ?? '');
        $masked = $number === '' ? '' : ' ••••'.substr($number, -4);

        return strtoupper((string) $refund->bank_code).$masked;
    }
}
