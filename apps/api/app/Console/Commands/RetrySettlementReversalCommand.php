<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Actions\Settlement\ReverseMerchantSettlementAction;
use App\Models\RefundRequest;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Finishes settlement reversals the refund flow could not.
 *
 * Two ways a reversal is left unbooked with the customer already paid:
 *
 *   - the action runs post-commit, so a crash between the refund's commit and
 *     that call leaves nothing behind;
 *   - the action declines to book when the merchant's wallet cannot absorb the
 *     debit (the merchant spent the money), which is the state a human has to
 *     chase.
 *
 * Both are findable by the same pair of facts: `refunded_at` is set and
 * `settlement_reversed_at` is still null. Retrying is safe — the action is
 * idempotent through the ledger mutation's reference — so this runs on a
 * schedule instead of waiting for an alert to be read.
 *
 * Nothing here alerts: whatever went wrong was reported by the attempt that
 * caused it, and a merchant who has spent the money would fail on every run.
 */
class RetrySettlementReversalCommand extends Command
{
    protected $signature = 'refunds:retry-settlement-reversal {--limit=50 : How many refunds to attempt per run}';

    protected $description = 'Retry settlement reversals that never booked — the refund paid the customer but the merchant leg is missing';

    public function handle(ReverseMerchantSettlementAction $reverse): int
    {
        $refunds = RefundRequest::query()
            // The customer was made whole ...
            ->whereNotNull('refunded_at')
            // ... and the books never followed.
            ->whereNull('settlement_reversed_at')
            ->orderBy('id')
            ->limit(max(1, (int) $this->option('limit')))
            ->get();

        if ($refunds->isEmpty()) {
            $this->info('No unsettled reversals.');

            return self::SUCCESS;
        }

        $booked = 0;
        $stillShort = 0;

        foreach ($refunds as $refund) {
            if ($reverse->execute($refund, alert: false)) {
                $booked++;
            } else {
                $stillShort++;
            }
        }

        $summary = "Settlement reversal retry: {$booked} booked, {$stillShort} still short of {$refunds->count()} checked.";

        if ($stillShort > 0) {
            Log::warning($summary);
            $this->warn($summary);
        } else {
            Log::info($summary);
            $this->info($summary);
        }

        return self::SUCCESS;
    }
}
