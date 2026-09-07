<?php

namespace App\Actions\Transaction;

use App\Jobs\SendTransactionWhatsAppJob;
use App\Mail\TransactionReceiptMail;
use App\Models\Transaction;
use App\Support\Phone;
use Illuminate\Support\Facades\Mail;

/**
 * Notifies the buyer that an order is COMPLETED, over two independent channels:
 * email (the receipt) and WhatsApp (the same bukti pembayaran as a PDF document).
 *
 * Each channel is idempotent on its own timestamp — `receipt_sent_at` for email,
 * `whatsapp_sent_at` for WhatsApp — so one can send when the other has no
 * recipient, and neither fires twice. `$force` (the admin "Resend Receipt"
 * action) re-sends both. No-op per channel when its recipient is missing.
 */
class SendTransactionReceiptAction
{
    public function execute(Transaction $transaction, bool $force = false): bool
    {
        $transaction->loadMissing('user');

        $locale = $this->resolveLocale($transaction);

        $emailSent = $this->sendEmail($transaction, $locale, $force);
        $this->sendWhatsApp($transaction, $locale, $force);

        return $emailSent;
    }

    private function sendEmail(Transaction $transaction, string $locale, bool $force): bool
    {
        if (! $force && $transaction->receipt_sent_at !== null) {
            return false;
        }

        // The buyer's account email if a member, else the email captured at checkout.
        $email = $transaction->user?->email ?? $transaction->contact_email;

        if (! $email) {
            return false;
        }

        Mail::to($email)->locale($locale)->queue(new TransactionReceiptMail($transaction, $locale));

        $transaction->forceFill(['receipt_sent_at' => now()])->save();

        return true;
    }

    private function sendWhatsApp(Transaction $transaction, string $locale, bool $force): void
    {
        if (! $force && $transaction->whatsapp_sent_at !== null) {
            return;
        }

        // Member phone first, else the WhatsApp number captured at guest checkout.
        $recipient = Phone::toE164($transaction->user?->phone ?? $transaction->guest_contact);

        if ($recipient === null) {
            return;
        }

        SendTransactionWhatsAppJob::dispatch($transaction, $locale);

        // Optimistic — mirrors the email guard, which marks sent after queueing.
        $transaction->forceFill(['whatsapp_sent_at' => now()])->save();
    }

    private function resolveLocale(Transaction $transaction): string
    {
        $locale = in_array($transaction->locale, ['id', 'en'], true)
            ? $transaction->locale
            : ($transaction->user?->locale ?? 'id');

        return in_array($locale, ['id', 'en'], true) ? $locale : 'id';
    }
}
