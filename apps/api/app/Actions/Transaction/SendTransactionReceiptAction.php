<?php

namespace App\Actions\Transaction;

use App\Mail\TransactionReceiptMail;
use App\Models\Transaction;
use Illuminate\Support\Facades\Mail;

/**
 * Emails the purchase receipt to the buyer when an order is COMPLETED.
 *
 * Idempotent: skips if a receipt was already sent (guarded by
 * `receipt_sent_at`), unless `$force` is passed — the admin "Resend Receipt"
 * action uses force. No-op when there is no recipient email on record.
 */
class SendTransactionReceiptAction
{
    public function execute(Transaction $transaction, bool $force = false): bool
    {
        if (! $force && $transaction->receipt_sent_at !== null) {
            return false;
        }

        $transaction->loadMissing('user');

        // The buyer's account email if a member, else the email captured at checkout.
        $email = $transaction->user?->email ?? $transaction->contact_email;

        if (! $email) {
            return false;
        }

        $locale = in_array($transaction->locale, ['id', 'en'], true)
            ? $transaction->locale
            : ($transaction->user?->locale ?? 'id');
        $locale = in_array($locale, ['id', 'en'], true) ? $locale : 'id';

        Mail::to($email)->locale($locale)->queue(new TransactionReceiptMail($transaction, $locale));

        $transaction->forceFill(['receipt_sent_at' => now()])->save();

        return true;
    }
}
