<?php

namespace App\Console\Commands;

use App\Actions\Uxiotopup\CheckUxiotopupPricesAction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Scheduled every 5 minutes. Quiet by design: one summary line,
 * no Discord output (the scheduler's onFailure hook alerts on failure).
 */
class CheckUxiotopupPricesCommand extends Command
{
    protected $signature = 'uxiotopup:check-prices';

    protected $description = 'Check uxiotopup prices: update supplier cost/availability, auto-reprice live products from the margin rules, and record a price-change log. Locked prices are left frozen; products are never auto-created.';

    public function handle(CheckUxiotopupPricesAction $action): int
    {
        try {
            $report = $action->execute();
        } catch (Throwable $e) {
            $this->error("Price check failed: {$e->getMessage()}");
            Log::channel('uxiotopup')->error('uxiotopup:check-prices failed', ['error' => $e->getMessage()]);

            return self::FAILURE;
        }

        $this->info(sprintf(
            '%d layanan, %d modal berubah (%d di-reprice, %d terkunci, %d margin negatif, %d nonaktif perlu perhatian), %d aktif lagi, %d layanan tak dikenal',
            $report->totalFetched,
            $report->priceChangedCount,
            $report->repricedCount,
            $report->lockedCount,
            $report->negativeMarginCount,
            $report->deactivatedLoggedCount,
            count($report->reactivated),
            $report->unknownCount,
        ));

        return self::SUCCESS;
    }
}
