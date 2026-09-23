<?php

namespace App\Actions\Transaction;

use App\Contracts\ReceiptChannel;
use App\Models\Transaction;
use App\Support\Integration\AdapterResolver;

/**
 * Tells the buyer that an order is COMPLETED.
 *
 * The channels are a LIST, not a decision this class makes:
 * `config('notifications.receipt')` names them and each is resolved through
 * `ReceiptChannel`. Email (the receipt) ships on; WhatsApp (the same bukti
 * pembayaran as a PDF document) is part of the future subscription and ships
 * off, so its queued send is a no-op until it is switched on
 * (`PiWapiService::canSend()`).
 *
 * Each channel is idempotent on its OWN timestamp — `receipt_sent_at` for email,
 * `whatsapp_sent_at` for WhatsApp — so one can send when the other has no
 * recipient, and neither fires twice. `$force` (the admin "Resend Receipt"
 * action) re-sends all of them.
 *
 * Returns whether ANY channel queued a message: "the customer was told", which
 * is what the resend path and the tests read it as.
 */
class SendTransactionReceiptAction
{
    public function execute(Transaction $transaction, bool $force = false): bool
    {
        $transaction->loadMissing('user');

        $locale = $this->resolveLocale($transaction);
        $sent = false;

        foreach (AdapterResolver::resolveAll(ReceiptChannel::class, (array) config('notifications.receipt', [])) as $channel) {
            // Deliberately not short-circuiting: a channel with no recipient must
            // not stop the next one from sending.
            $sent = $channel->send($transaction, $locale, $force) || $sent;
        }

        return $sent;
    }

    private function resolveLocale(Transaction $transaction): string
    {
        $locale = in_array($transaction->locale, ['id', 'en'], true)
            ? $transaction->locale
            : ($transaction->user?->locale ?? 'id');

        return in_array($locale, ['id', 'en'], true) ? $locale : 'id';
    }
}
