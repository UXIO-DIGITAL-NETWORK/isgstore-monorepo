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

    protected $description = 'Check uxiotopup prices: update supplier cost/availability and raise price change alerts. Never creates products or changes selling prices.';

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
            '%d layanan, %d perubahan modal (%d alert baru, %d diperbarui), %d nonaktif, %d aktif lagi, %d layanan tak dikenal',
            $report->totalFetched,
            $report->priceChangedCount,
            $report->alertsCreated,
            $report->alertsUpdated,
            count($report->deactivated),
            count($report->reactivated),
            $report->unknownCount,
        ));

        return self::SUCCESS;
    }
}
