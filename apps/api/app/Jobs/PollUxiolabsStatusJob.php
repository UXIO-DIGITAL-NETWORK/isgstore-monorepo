<?php

namespace App\Jobs;

use App\Actions\Uxiolabs\CheckUxiolabsTransactionStatusAction;
use App\Enums\TransactionStatus;
use App\Models\Transaction;
use App\Services\DiscordWebhookService;
use App\Support\Uxiolabs\StatusPollSchedule;
use Carbon\CarbonImmutable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Jobs\SyncJob;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Actively polls uxiolabs's /status for one order, then re-dispatches itself on
 * a widening cadence (StatusPollSchedule) until the order reaches a terminal
 * state. This is the recovery path for the unreliable supplier callback: it
 * reuses the same idempotent CheckUxiolabsTransactionStatusAction the manual
 * "resend callback" endpoint uses, so refund/receipt logic is never forked.
 *
 * One chain per in-flight order — when the order completes, the chain ends — so
 * total supplier calls scale with orders awaiting fulfilment, not with the
 * customer's every-5s receipt-page polling.
 */
class PollUxiolabsStatusJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** The chain owns its own retry via re-dispatch; a queue retry must not fork it. */
    public int $tries = 1;

    public function __construct(
        public int $transactionId,
        public string $startedAt, // ISO-8601 — when the order was placed; anchors the backoff
    ) {}

    public function handle(CheckUxiolabsTransactionStatusAction $action, DiscordWebhookService $discord): void
    {
        // The escalating chain needs an async queue to honour ->delay(); under the
        // sync driver (tests, or a misconfigured env) a self-re-dispatch would recurse
        // instantly. No-op there — production runs the database queue, and the reaper
        // (uxiolabs:sync-processing) covers a sync-only setup.
        if ($this->job instanceof SyncJob) {
            return;
        }

        $transaction = Transaction::find($this->transactionId);

        // Gone, or already driven terminal (by a late callback, admin action, or an
        // earlier poll) → the chain is done.
        if (! $transaction || $transaction->status !== TransactionStatus::PROCESSING) {
            return;
        }

        // /status has no idtrx lookup; without the supplier's own invoice there is
        // nothing to poll. The reaper alerts these — end the chain.
        if (! $transaction->supplier_trx_id) {
            return;
        }

        try {
            $action->execute($transaction->invoice_number);
        } catch (Throwable $e) {
            // A supplier/network blip must not kill the chain — log and keep polling.
            Log::channel('uxiolabs')->warning('PollUxiolabsStatusJob: status check failed', [
                'transaction_id' => $this->transactionId,
                'error' => $e->getMessage(),
            ]);
        }

        // Reflect the poll result and record the poll time for the reaper's staleness
        // check (saveQuietly so a no-change poll doesn't bump updated_at).
        $transaction->refresh();
        $transaction->supplier_status_checked_at = now();
        $transaction->saveQuietly();

        // Terminal now? The action already fired refund/receipt — stop.
        if ($transaction->status !== TransactionStatus::PROCESSING) {
            return;
        }

        $elapsed = (int) abs(CarbonImmutable::parse($this->startedAt)->diffInSeconds(now()));

        // Abnormally slow (the callback is down) → page a human once, but keep polling:
        // the customer paid and the order may still land, so we must not silently give up.
        if ($elapsed >= StatusPollSchedule::STALE_SECONDS
            && Cache::add("uxiolabs-stuck:{$this->transactionId}", true, now()->addHours(24))) {
            $discord->sendAlert(
                'Uxiolabs order stuck PROCESSING > 3h (callback down) — check the supplier dashboard: '
                ."{$transaction->invoice_number} (supplier_trx_id {$transaction->supplier_trx_id})."
            );
        }

        self::dispatch($this->transactionId, $this->startedAt)
            ->delay(now()->addSeconds(StatusPollSchedule::intervalSeconds($elapsed)));
    }

    public function failed(Throwable $e): void
    {
        Log::channel('uxiolabs')->error('PollUxiolabsStatusJob: terminal failure', [
            'transaction_id' => $this->transactionId,
            'error' => $e->getMessage(),
        ]);
    }
}
