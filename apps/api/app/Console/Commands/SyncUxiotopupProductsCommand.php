<?php

namespace App\Console\Commands;

use App\Actions\Uxiotopup\CheckUxiotopupPricesAction;
use App\DTOs\Uxiotopup\PriceCheckReportDTO;
use App\Services\DiscordWebhookService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Manual price check (name kept for operator familiarity — the old auto-sync
 * behavior is gone). Delegates to the same checker the 5-minute schedule uses,
 * then sends a full report to Discord.
 */
class SyncUxiotopupProductsCommand extends Command
{
    protected $signature = 'uxiotopup:sync-products';

    protected $description = 'Cek harga uxiotopup manual: update modal/availability, reprice otomatis produk live dari aturan margin, dan catat price-change log. Harga terkunci dibiarkan; produk tidak dibuat otomatis.';

    public function handle(CheckUxiotopupPricesAction $action, DiscordWebhookService $discord): int
    {
        try {
            $report = $action->execute();
        } catch (Throwable $e) {
            $this->error("Price check failed: {$e->getMessage()}");
            Log::channel('uxiotopup')->error('uxiotopup:sync-products failed', ['error' => $e->getMessage()]);

            return self::FAILURE;
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
            ['Locked (skipped)', $report->lockedCount],
            ['Negative margin (logged)', $report->negativeMarginCount],
            ['Deactivated (attention)', $report->deactivatedLoggedCount],
            ['Mappings reactivated', count($report->reactivated)],
            ['Negative margin products (all)', count($report->negativeMargin)],
            ['Unknown services (not mapped locally)', $report->unknownCount],
        ]);

        foreach ($report->negativeMargin as $row) {
            $this->warn("  NEGATIVE MARGIN: {$row['product']} ({$row['sku']}) cost {$row['cost']} > member price {$row['price_member']}");
        }
    }

    private function sendDiscordReport(DiscordWebhookService $discord, PriceCheckReportDTO $report): void
    {
        $fields = [
            [
                'name' => 'PREPAID',
                'value' => "Layanan: {$report->totalFetched} • Modal berubah: {$report->priceChangedCount} • "
                    ."Reprice: {$report->repricedCount} • Terkunci: {$report->lockedCount} • "
                    ."Margin negatif: {$report->negativeMarginCount} • "
                    ."Nonaktif (perlu perhatian): {$report->deactivatedLoggedCount}"
                    .' • Aktif lagi: '.count($report->reactivated)
                    ." • Layanan tak dikenal: {$report->unknownCount}",
                'inline' => false,
            ],
        ];

        $needsAttention = $report->negativeMargin !== []
            || $report->deactivatedLoggedCount > 0;

        if ($report->negativeMargin !== []) {
            $fields[] = [
                'name' => '⚠️ Margin negatif — checkout DITOLAK sampai di-reprice',
                'value' => implode("\n", array_slice(array_map(
                    fn ($row) => "`{$row['sku']}` {$row['product']}: modal {$row['cost']} > jual {$row['price_member']}",
                    $report->negativeMargin
                ), 0, 15)),
                'inline' => false,
            ];
        }

        if ($report->unknownSkusSample !== []) {
            $fields[] = [
                'name' => 'ℹ️ Contoh layanan uxiotopup yang belum ditambahkan',
                'value' => '`'.implode('`, `', array_slice($report->unknownSkusSample, 0, 20)).'`'
                    .($report->unknownCount > 20 ? " … total {$report->unknownCount}" : ''),
                'inline' => false,
            ];
        }

        $discord->sendEmbed(
            '[UXIOTOPUP] 📦 Laporan Cek Harga uxiotopup',
            $fields,
            $needsAttention ? DiscordWebhookService::COLOR_ORANGE : DiscordWebhookService::COLOR_GREEN
        );
    }
}
