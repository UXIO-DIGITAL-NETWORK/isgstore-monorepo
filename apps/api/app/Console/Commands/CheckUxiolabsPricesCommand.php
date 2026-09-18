<?php

namespace App\Console\Commands;

use App\Actions\Uxiolabs\CheckUxiolabsPricesAction;
use App\Actions\Uxiolabs\SendPriceCheckDiscordReportAction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Scheduled every 5 minutes.
 *
 * Sends the run's report to Discord on **every** tick — the same embed the manual
 * run sends, marked `terjadwal`. That is 288 messages a day by choice: the
 * operator wants the checker's log in the channel, not only when it crashes. The
 * console stays one summary line.
 */
class CheckUxiolabsPricesCommand extends Command
{
    protected $signature = 'uxiolabs:check-prices';

    protected $description = 'Check uxiolabs prices: update supplier cost/availability, auto-reprice live products from the margin rules, and record a price-change log. Products are never auto-created.';

    public function handle(CheckUxiolabsPricesAction $action, SendPriceCheckDiscordReportAction $discord): int
    {
        try {
            $report = $action->execute();
        } catch (Throwable $e) {
            $this->error("Price check failed: {$e->getMessage()}");
            Log::channel('uxiolabs')->error('uxiolabs:check-prices failed', ['error' => $e->getMessage()]);

            return self::FAILURE;
        }

        // Reported first, and unconditionally: a skipped tick is part of the log
        // too. Discord is not allowed to fail the run — the service swallows its
        // own errors.
        $discord->execute($report, SendPriceCheckDiscordReportAction::SOURCE_SCHEDULED);

        if ($report->skippedReason !== null) {
            // Another sync held the lock. Not a failure — that run reports what
            // happened, and the scheduler's onFailure hook would double the alarm.
            $this->warn($report->skippedReason);

            return self::SUCCESS;
        }

        $this->info(sprintf(
            '%d layanan, %d modal berubah (%d di-reprice, %d tetap, %d gagal, %d margin negatif, %d nonaktif perlu perhatian), %d aktif lagi, %d layanan tak dikenal',
            $report->totalFetched,
            $report->priceChangedCount,
            $report->repricedCount,
            $report->unchangedCount,
            $report->failedCount,
            $report->negativeMarginCount,
            $report->deactivatedLoggedCount,
            count($report->reactivated),
            $report->unknownCount,
        ));

        return self::SUCCESS;
    }
}
