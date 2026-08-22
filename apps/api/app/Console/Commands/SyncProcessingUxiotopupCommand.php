<?php

namespace App\Console\Commands;

use App\Enums\TransactionStatus;
use App\Jobs\PollUxiotopupStatusJob;
use App\Models\Transaction;
use App\Services\DiscordWebhookService;
use Illuminate\Console\Command;

/**
 * Safety net for the per-order poll chains (PollUxiotopupStatusJob). A chain can
 * die — a worker restart, an exhausted job, or a row that entered PROCESSING
 * before this feature shipped — leaving a paid order stuck forever while the
 * supplier callback is down. This re-arms any pollable order whose last poll is
 * stale, and alerts a human for orders that cannot be polled at all.
 */
class SyncProcessingUxiotopupCommand extends Command
{
    protected $signature = 'uxiotopup:sync-processing
        {--dry-run : Show what would be re-armed/alerted without dispatching or notifying}';

    protected $description = 'Re-arm stalled uxiotopup status-poll chains and alert on orders that cannot be auto-polled.';

    /** A healthy 5s chain caps its interval at 5 min, so >10 min silent means the chain died. */
    private const REARM_STALE_MINUTES = 10;

    /** Grace before alerting a PROCESSING order that has no supplier_trx_id to poll. */
    private const UNPOLLABLE_GRACE_MINUTES = 15;

    public function handle(DiscordWebhookService $discord): int
    {
        $dry = (bool) $this->option('dry-run');
        $reArmed = 0;

        // Re-arm pollable-but-stalled chains. A fresh chain keeps supplier_status_checked_at
        // current, so it is skipped here — no double chains.
        Transaction::where('status', TransactionStatus::PROCESSING->value)
            ->whereNotNull('supplier_trx_id')
            ->where(function ($q) {
                $q->whereNull('supplier_status_checked_at')
                    ->orWhere('supplier_status_checked_at', '<=', now()->subMinutes(self::REARM_STALE_MINUTES));
            })
            ->chunkById(200, function ($rows) use (&$reArmed, $dry) {
                foreach ($rows as $transaction) {
                    if (! $dry) {
                        PollUxiotopupStatusJob::dispatch($transaction->id, now()->toIso8601String())
                            ->delay(now()->addSeconds(5));
                    }
                    $reArmed++;
                }
            });

        // Orders stuck PROCESSING with no supplier invoice cannot be polled (/status
        // has no idtrx lookup) — the lost order response can only be recovered by the
        // callback, which is down. Escalate to a human.
        $unpollable = Transaction::where('status', TransactionStatus::PROCESSING->value)
            ->whereNull('supplier_trx_id')
            ->where('updated_at', '<=', now()->subMinutes(self::UNPOLLABLE_GRACE_MINUTES))
            ->pluck('invoice_number');

        $this->table(
            ['Outcome', 'Count'],
            [['Re-armed', $reArmed], ['Unpollable (alerted)', $unpollable->count()]]
        );

        if ($unpollable->isNotEmpty() && ! $dry) {
            $this->warn($unpollable->count().' order(s) stuck with no supplier order id — alerting for manual review.');
            $discord->sendAlert(
                'Uxiotopup order(s) stuck PROCESSING with no supplier order id — cannot auto-poll (callback down); '
                .'resolve by hand: '.$unpollable->implode(', ')
            );
        }

        return self::SUCCESS;
    }
}
