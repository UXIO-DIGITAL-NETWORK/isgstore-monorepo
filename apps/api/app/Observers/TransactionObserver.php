<?php

namespace App\Observers;

use App\Events\TransactionStatusUpdated;
use App\Models\Transaction;

/**
 * Single choke point for realtime transaction broadcasts.
 *
 * Status changes happen in many places (Monetapay webhook, the uxiotopup jobs,
 * refunds). Rather than dispatch from each, we observe the model: any created
 * row or any update that actually changed `status` fires one broadcast event.
 * Combined with the event's ShouldDispatchAfterCommit, no transition is missed
 * and none races an open DB transaction.
 */
class TransactionObserver
{
    public function created(Transaction $transaction): void
    {
        // A new PENDING order should surface live in the admin feed.
        TransactionStatusUpdated::dispatch($transaction);
    }

    public function updated(Transaction $transaction): void
    {
        if ($transaction->wasChanged('status')) {
            TransactionStatusUpdated::dispatch($transaction);
        }
    }
}
