<?php

declare(strict_types=1);

namespace App\Notifications\Channels;

use App\Contracts\ReceiptChannel;
use App\Mail\TransactionReceiptMail;
use App\Models\Transaction;
use Illuminate\Support\Facades\Mail;

/**
 * The receipt itself, by email.
 *
 * The only channel that currently carries a usable order record to the buyer,
 * so its guard (`receipt_sent_at`) is the one that matters most: a duplicate
 * receipt email is worse than a missed one, because the customer already has it.
 */
class EmailReceiptChannel implements ReceiptChannel
{
    public function send(Transaction $transaction, string $locale, bool $force = false): bool
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
}
