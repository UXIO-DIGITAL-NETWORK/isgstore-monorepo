<?php

namespace App\Observers;

use App\Enums\ProviderStatus;
use App\Enums\TransactionStatus;
use App\Events\TransactionStatusUpdated;
use App\Models\Transaction;
use App\Support\Transaction\ProviderStatusPolicy;
use DomainException;
use Illuminate\Support\Facades\Log;

/**
 * Single choke point for realtime transaction broadcasts, and for keeping
 * `provider_status` honest.
 *
 * Status changes happen in many places (Monetapay webhook, the uxiotopup jobs,
 * refunds). Rather than dispatch from each, we observe the model: any created
 * row or any update that actually changed `status` fires one broadcast event.
 * Combined with the event's ShouldDispatchAfterCommit, no transition is missed
 * and none races an open DB transaction.
 *
 * `saving()` extends that same argument to the second status column. A dozen
 * places write `transactions.status`; asking each to also maintain
 * `provider_status` is a convention that lasts until the next one is added. Here
 * it is filled in automatically and contradictory pairs are refused, so the two
 * columns cannot drift.
 *
 * One hole, and it is why this must never be worked around: `saveQuietly()`
 * suppresses model events, including this guard. Never `saveQuietly()` a change
 * to `status`.
 */
class TransactionObserver
{
    public function saving(Transaction $transaction): void
    {
        $status = $transaction->status;

        // Nothing to reconcile against until a status exists — the DB default
        // covers a row saved without one.
        if (! $status instanceof TransactionStatus) {
            return;
        }

        $providerDirty = $transaction->isDirty('provider_status');
        $statusDirty = $transaction->isDirty('status') || ! $transaction->exists;

        if (! $providerDirty && ! $statusDirty) {
            return;
        }

        if ($providerDirty) {
            // The caller knows something the status alone cannot express — the
            // supplier accepted the order, say. Honour it, but only if it is a
            // pair that can actually be true.
            $this->guard($transaction, $status, $transaction->provider_status);

            return;
        }

        // Status moved and the caller said nothing about the provider. This is the
        // branch that makes forgetting impossible.
        if (ProviderStatusPolicy::keepsPreviousOn($status)) {
            // A refund says money came back, never whether the supplier delivered.
            // Keep what we already knew.
            if ($transaction->provider_status instanceof ProviderStatus) {
                return;
            }
        }

        $transaction->provider_status = ProviderStatusPolicy::defaultFor($status)
            ?? ProviderStatus::NOT_ORDERED;
    }

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

    /**
     * Refuse a pair that cannot be true — loudly outside production, quietly
     * inside it.
     *
     * Both webhook handlers do their writes inside a DB::transaction(). Throwing
     * there returns a non-2xx, and Monetapay and uxiotopup both retry a non-2xx
     * callback — indefinitely. A money path must not wedge over a bookkeeping
     * disagreement, and an impossible pair can only come from new code, which the
     * tests catch long before a deploy. So: throw where a developer will see it,
     * and correct-and-log where a customer would otherwise be stuck.
     */
    private function guard(Transaction $transaction, TransactionStatus $status, mixed $provider): void
    {
        if ($provider instanceof ProviderStatus && ProviderStatusPolicy::allows($status, $provider)) {
            return;
        }

        $fallback = ProviderStatusPolicy::defaultFor($status) ?? ProviderStatus::NOT_ORDERED;

        if (! app()->isProduction()) {
            throw new DomainException(sprintf(
                'provider_status %s cannot coexist with status %s (allowed: %s).',
                $provider instanceof ProviderStatus ? $provider->value : var_export($provider, true),
                $status->value,
                implode(', ', array_map(fn (ProviderStatus $p) => $p->value, ProviderStatusPolicy::allowedFor($status))),
            ));
        }

        Log::error('Incompatible provider_status coerced', [
            'transaction_id' => $transaction->id,
            'invoice_number' => $transaction->invoice_number,
            'status' => $status->value,
            'attempted' => $provider instanceof ProviderStatus ? $provider->value : null,
            'coerced_to' => $fallback->value,
        ]);

        $transaction->provider_status = $fallback;
    }
}
