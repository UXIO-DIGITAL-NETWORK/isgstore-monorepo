<?php

namespace App\Console\Commands;

use App\Actions\Digiflazz\CheckDigiflazzPricesAction;
use App\DTOs\Digiflazz\PriceCheckReportDTO;
use App\Services\DiscordWebhookService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Manual price check (name kept for operator familiarity — the old auto-sync
 * behavior is gone). Delegates to the same checker the 5-minute schedule uses,
 * then sends a full report to Discord.
 */
class SyncDigiflazzProductsCommand extends Command
{
    protected $signature = 'digiflazz:sync-products
                            {--type=all : Price list to check: prepaid, pasca, or all}';

    protected $description = 'Cek harga Digiflazz manual: update modal/availability + buat price alert. TIDAK membuat produk / mengubah harga jual.';

    public function handle(CheckDigiflazzPricesAction $action, DiscordWebhookService $discord): int
    {
        $option = (string) $this->option('type');
        $types = $option === 'all' ? ['prepaid', 'pasca'] : [$option];

        $reports = [];

        foreach ($types as $type) {
            try {
                $report = $action->execute($type);
            } catch (Throwable $e) {
                $this->error("Price check {$type} failed: {$e->getMessage()}");
                Log::channel('digiflazz')->error("digiflazz:sync-products ({$type}) failed", ['error' => $e->getMessage()]);

                return self::FAILURE;
            }

            $reports[] = $report;
            $this->renderReport($report);
        }

        $this->sendDiscordReport($discord, $reports);

        return self::SUCCESS;
    }

    private function renderReport(PriceCheckReportDTO $report): void
    {
        $this->info("Digiflazz price check — {$report->type}");
        $this->table(['Metric', 'Value'], [
            ['SKUs fetched', $report->totalFetched],
            ['Cost changes', $report->priceChangedCount],
            ['Alerts created', $report->alertsCreated],
            ['Alerts updated', $report->alertsUpdated],
            ['Mappings deactivated', count($report->deactivated)],
            ['Mappings reactivated', count($report->reactivated)],
            ['Negative margin products', count($report->negativeMargin)],
            ['Unknown SKUs (not mapped locally)', $report->unknownCount],
        ]);

        foreach ($report->negativeMargin as $row) {
            $this->warn("  NEGATIVE MARGIN: {$row['product']} ({$row['sku']}) cost {$row['cost']} > member price {$row['price_member']}");
        }
    }

    /**
     * @param  array<int,PriceCheckReportDTO>  $reports
     */
    private function sendDiscordReport(DiscordWebhookService $discord, array $reports): void
    {
        $fields = [];
        $hasNegativeMargin = false;

        foreach ($reports as $report) {
            $fields[] = [
                'name' => strtoupper($report->type),
                'value' => "SKU: {$report->totalFetched} • Modal berubah: {$report->priceChangedCount} • "
                    ."Alert baru: {$report->alertsCreated} • Alert diperbarui: {$report->alertsUpdated} • "
                    .'Nonaktif: '.count($report->deactivated)
                    .' • Aktif lagi: '.count($report->reactivated)
                    ." • SKU tak dikenal: {$report->unknownCount}",
                'inline' => false,
            ];

            if ($report->negativeMargin !== []) {
                $hasNegativeMargin = true;
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
                    'name' => 'ℹ️ Contoh SKU Digiflazz yang belum ditambahkan',
                    'value' => '`'.implode('`, `', array_slice($report->unknownSkusSample, 0, 20)).'`'
                        .($report->unknownCount > 20 ? " … total {$report->unknownCount}" : ''),
                    'inline' => false,
                ];
            }
        }

        $discord->sendEmbed(
            '[DIGIFLAZZ] 📦 Laporan Cek Harga Digiflazz',
            $fields,
            $hasNegativeMargin ? DiscordWebhookService::COLOR_ORANGE : DiscordWebhookService::COLOR_GREEN
        );
    }
}
