<?php

namespace App\Console\Commands;

use App\Actions\Uxiolabs\CheckUxiolabsPricesAction;
use App\DTOs\Uxiolabs\PriceCheckReportDTO;
use App\Services\DiscordWebhookService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Manual price check (name kept for operator familiarity — the old auto-sync
 * behavior is gone). Delegates to the same checker the 5-minute schedule uses,
 * then sends a full report to Discord.
 */
class SyncUxiolabsProductsCommand extends Command
{
    protected $signature = 'uxiolabs:sync-products';

    protected $description = 'Cek harga uxiolabs manual: update modal/availability, reprice otomatis produk live dari aturan margin, dan catat price-change log. Produk tidak dibuat otomatis.';

    public function handle(CheckUxiolabsPricesAction $action, DiscordWebhookService $discord): int
    {
        try {
            $report = $action->execute();
        } catch (Throwable $e) {
            $this->error("Price check failed: {$e->getMessage()}");
            Log::channel('uxiolabs')->error('uxiolabs:sync-products failed', ['error' => $e->getMessage()]);

            return self::FAILURE;
        }

        if ($report->skippedReason !== null) {
            $this->warn($report->skippedReason);

            return self::SUCCESS;
        }

        $this->renderReport($report);
        $this->sendDiscordReport($discord, $report);

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

    private function sendDiscordReport(DiscordWebhookService $discord, PriceCheckReportDTO $report): void
    {
        $fields = [
            [
                'name' => 'PREPAID',
                'value' => "Layanan: {$report->totalFetched} • Modal berubah: {$report->priceChangedCount} • "
                    ."Reprice: {$report->repricedCount} • Tetap: {$report->unchangedCount} • Gagal: {$report->failedCount} • "
                    ."Margin negatif: {$report->negativeMarginCount} • "
                    ."Nonaktif (perlu perhatian): {$report->deactivatedLoggedCount}"
                    .' • Aktif lagi: '.count($report->reactivated)
                    ." • Layanan tak dikenal: {$report->unknownCount}",
                'inline' => false,
            ],
        ];

        $needsAttention = $report->negativeMargin !== []
            || $report->deactivatedLoggedCount > 0
            || $report->failedCount > 0;

        if ($report->negativeMargin !== []) {
            $fields[] = [
                'name' => '⚠️ Margin negatif — checkout DITOLAK untuk tier itu',
                'value' => implode("\n", array_slice(array_map(
                    fn ($row) => "`{$row['sku']}` {$row['product']} [{$row['tier']}]: modal {$row['cost']} > jual {$row['price']}",
                    $report->negativeMargin
                ), 0, 15)),
                'inline' => false,
            ];
        }

        if ($report->failedSkusSample !== []) {
            $fields[] = [
                'name' => '⚠️ Reprice gagal — harga jual masih di modal lama',
                'value' => '`'.implode('`, `', $report->failedSkusSample).'`'
                    .($report->failedCount > count($report->failedSkusSample) ? " … total {$report->failedCount}" : '')
                    .' — lihat log `uxiolabs` di server.',
                'inline' => false,
            ];
        }

        if ($report->unknownSkusSample !== []) {
            $fields[] = [
                'name' => 'ℹ️ Contoh layanan uxiolabs yang belum ditambahkan',
                'value' => '`'.implode('`, `', array_slice($report->unknownSkusSample, 0, 20)).'`'
                    .($report->unknownCount > 20 ? " … total {$report->unknownCount}" : ''),
                'inline' => false,
            ];
        }

        $discord->sendEmbed(
            '[UXIOLABS] 📦 Laporan Cek Harga uxiolabs',
            $fields,
            $needsAttention ? DiscordWebhookService::COLOR_ORANGE : DiscordWebhookService::COLOR_GREEN
        );
    }
}
