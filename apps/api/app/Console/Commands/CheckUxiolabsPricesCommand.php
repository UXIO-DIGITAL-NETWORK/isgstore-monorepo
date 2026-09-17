<?php

namespace App\Console\Commands;

use App\Actions\Uxiolabs\CheckUxiolabsPricesAction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Scheduled every 5 minutes. Quiet by design: one summary line,
 * no Discord output (the scheduler's onFailure hook alerts on failure).
 */
class CheckUxiolabsPricesCommand extends Command
{
    protected $signature = 'uxiolabs:check-prices';

    protected $description = 'Check uxiolabs prices: update supplier cost/availability, auto-reprice live products from the margin rules, and record a price-change log. Products are never auto-created.';

    public function handle(CheckUxiolabsPricesAction $action): int
    {
        try {
            $report = $action->execute();
        } catch (Throwable $e) {
            $this->error("Price check failed: {$e->getMessage()}");
            Log::channel('uxiolabs')->error('uxiolabs:check-prices failed', ['error' => $e->getMessage()]);

            return self::FAILURE;
        }

        if ($report->skippedReason !== null) {
            // Another sync held the lock. Not a failure — that run will report
            // what happened, and alerting on this would double every alarm.
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
