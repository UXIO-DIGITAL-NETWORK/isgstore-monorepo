<?php

declare(strict_types=1);

namespace App\Contracts;

use App\Actions\Transaction\SendTransactionReceiptAction;
use App\Models\Transaction;

/**
 * One way of telling a buyer their order is COMPLETED.
 *
 * This is the "pengeras suara": the engine announces the moment, and each
 * channel that has been plugged in reacts. A client adds WhatsApp, its own SMS
 * gateway, or a social-media webhook by writing one class and naming it in
 * `config/notifications.php` — `SendTransactionReceiptAction` is not touched.
 *
 * Each channel owns BOTH halves of its delivery: the recipient it can reach and
 * its own idempotency guard. That is what lets one channel go quiet (a guest
 * with no phone number) without silencing the others.
 *
 * @see SendTransactionReceiptAction the caller
 */
interface ReceiptChannel
{
    /**
     * Deliver the receipt over this channel.
     *
     * @param  bool  $force  bypass this channel's idempotency guard (an admin resend)
     * @return bool true when a message was actually queued; false when this channel
     *              had no recipient, or had already sent one
     */
    public function send(Transaction $transaction, string $locale, bool $force = false): bool;
}
