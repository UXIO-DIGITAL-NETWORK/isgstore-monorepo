<?php

declare(strict_types=1);

namespace App\Actions\Refund;

use App\Jobs\SendRefundWhatsAppJob;
use App\Mail\RefundMail;
use App\Models\RefundRequest;
use App\Support\Phone;
use Illuminate\Support\Facades\Mail;

/**
 * Closes the loop: tells the customer the transfer has actually been made.
 *
 * Without it a guest's last signal is "we owe you money", and support carries
 * every "did you send it?" question by hand.
 */
class SendRefundCompletedNotificationAction
{
    public function execute(RefundRequest $refund): void
    {
        $refund->loadMissing('transaction');
        $locale = $this->resolveLocale($refund);

        if ($refund->contact_email) {
            Mail::to($refund->contact_email)
                ->locale($locale)
                ->queue(new RefundMail($refund, $locale, RefundMail::VARIANT_COMPLETED));
        }

        $recipient = Phone::toE164($refund->contact_phone);
        if ($recipient !== null) {
            SendRefundWhatsAppJob::dispatch($recipient, __('refund.wa_done', [
                'brand' => (string) config('services.storefront.brand', 'ISG Store'),
                'invoice' => $refund->transaction?->invoice_number ?? $refund->refund_number,
                'amount' => 'Rp '.number_format((int) $refund->amount, 0, ',', '.'),
                'destination' => $this->destination($refund),
            ], $locale));
        }
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

    private function resolveLocale(RefundRequest $refund): string
    {
        $locale = $refund->transaction?->locale;

        return in_array($locale, ['id', 'en'], true) ? $locale : 'id';
    }
}
