<?php

namespace App\Console\Commands;

use App\Actions\Digiflazz\CheckDigiflazzPricesAction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Scheduled every 5 minutes. Quiet by design: one summary line per type,
 * no Discord output (the scheduler's onFailure hook alerts on failure).
 */
class CheckDigiflazzPricesCommand extends Command
{
    protected $signature = 'digiflazz:check-prices
                            {--type=all : Price list to check: prepaid, pasca, or all}';

    protected $description = 'Check Digiflazz prices: update supplier cost/availability and raise price change alerts. Never creates products or changes selling prices.';

    public function handle(CheckDigiflazzPricesAction $action): int
    {
        $option = (string) $this->option('type');
        $types = $option === 'all' ? ['prepaid', 'pasca'] : [$option];

        foreach ($types as $type) {
            try {
                $report = $action->execute($type);
            } catch (Throwable $e) {
                $this->error("Price check {$type} failed: {$e->getMessage()}");
                Log::error("digiflazz:check-prices ({$type}) failed", ['error' => $e->getMessage()]);

                return self::FAILURE;
            }

            $this->info(sprintf(
                '%s: %d SKU, %d perubahan modal (%d alert baru, %d diperbarui), %d nonaktif, %d aktif lagi, %d SKU tak dikenal',
                $type,
                $report->totalFetched,
                $report->priceChangedCount,
                $report->alertsCreated,
                $report->alertsUpdated,
                count($report->deactivated),
                count($report->reactivated),
                $report->unknownCount,
            ));
        }

        return self::SUCCESS;
    }
}
