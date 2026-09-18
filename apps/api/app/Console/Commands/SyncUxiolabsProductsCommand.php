<?php

namespace App\Console\Commands;

use App\Actions\Uxiolabs\CheckUxiolabsPricesAction;
use App\Actions\Uxiolabs\SendPriceCheckDiscordReportAction;
use App\DTOs\Uxiolabs\PriceCheckReportDTO;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Manual price check (name kept for operator familiarity — the old auto-sync
 * behavior is gone). Delegates to the same checker the 5-minute schedule uses,
 * then sends the same Discord report the schedule does, marked `manual`.
 */
class SyncUxiolabsProductsCommand extends Command
{
    protected $signature = 'uxiolabs:sync-products';

    protected $description = 'Cek harga uxiolabs manual: update modal/availability, reprice otomatis produk live dari aturan margin, dan catat price-change log. Produk tidak dibuat otomatis.';

    public function handle(CheckUxiolabsPricesAction $action, SendPriceCheckDiscordReportAction $discord): int
    {
        try {
            $report = $action->execute();
        } catch (Throwable $e) {
            $this->error("Price check failed: {$e->getMessage()}");
            Log::channel('uxiolabs')->error('uxiolabs:sync-products failed', ['error' => $e->getMessage()]);

            return self::FAILURE;
        }

        // Reported before the early return: a hand-run that was skipped because a
        // scheduled tick held the lock should still say so.
        $discord->execute($report, SendPriceCheckDiscordReportAction::SOURCE_MANUAL);

        if ($report->skippedReason !== null) {
            $this->warn($report->skippedReason);

            return self::SUCCESS;
        }

        $this->renderReport($report);

        return self::SUCCESS;
    }

    private function renderReport(PriceCheckReportDTO $report): void
    {
        $this->info('Uxiotopup price check');
        $this->table(['Metric', 'Value'], [
            ['Services fetched', $report->totalFetched],
            ['Cost changes', $report->priceChangedCount],
            ['Repriced (applied)', $report->repricedCount],
            ['Unchanged (cost moved, price did not)', $report->unchangedCount],
            ['Failed (cost updated, price left alone)', $report->failedCount],
            ['Negative margin (logged)', $report->negativeMarginCount],
            ['Deactivated (attention)', $report->deactivatedLoggedCount],
            ['Mappings reactivated', count($report->reactivated)],
            ['Negative margin products (all)', count($report->negativeMargin)],
            ['Unknown services (not mapped locally)', $report->unknownCount],
        ]);

        foreach ($report->negativeMargin as $row) {
            $this->warn("  NEGATIVE MARGIN: {$row['product']} ({$row['sku']}) cost {$row['cost']} > {$row['tier']} price {$row['price']}");
        }

        if ($report->failedSkusSample !== []) {
            $this->error('  REPRICE FAILED (price left at the old cost): '.implode(', ', $report->failedSkusSample));
        }
    }
}
