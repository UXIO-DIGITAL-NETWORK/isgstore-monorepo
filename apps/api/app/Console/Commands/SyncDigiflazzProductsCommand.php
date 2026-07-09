<?php

namespace App\Console\Commands;

use App\Actions\Digiflazz\SyncDigiflazzProductsAction;
use App\DTOs\Digiflazz\SyncProductsReportDTO;
use App\Services\DiscordWebhookService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

class SyncDigiflazzProductsCommand extends Command
{
    protected $signature = 'digiflazz:sync-products
                            {--type=all : Price list to sync: prepaid, pasca, or all}';

    protected $description = 'Sync Digiflazz price list: supplier costs, availability, auto-created products and recalculated selling prices';

    public function handle(SyncDigiflazzProductsAction $action, DiscordWebhookService $discord): int
    {
        $option = (string) $this->option('type');
        $types = $option === 'all' ? ['prepaid', 'pasca'] : [$option];

        $reports = [];

        foreach ($types as $type) {
            try {
                $report = $action->execute($type);
            } catch (Throwable $e) {
                $this->error("Sync {$type} failed: {$e->getMessage()}");
                Log::error("digiflazz:sync-products ({$type}) failed", ['error' => $e->getMessage()]);

                return self::FAILURE;
            }

            $reports[] = $report;
            $this->renderReport($report);
        }

        $this->sendDiscordReport($discord, $reports);

        return self::SUCCESS;
    }

    private function renderReport(SyncProductsReportDTO $report): void
    {
        $this->info("Digiflazz sync — {$report->type}");
        $this->table(['Metric', 'Value'], [
            ['SKUs fetched', $report->totalFetched],
            ['Cost changes', $report->priceChangedCount],
            ['New products (inactive)', count($report->newProducts)],
            ['Mappings deactivated', count($report->deactivated)],
            ['Mappings reactivated', count($report->reactivated)],
            ['Negative margin products', count($report->negativeMargin)],
            ['Unmapped brands', implode(', ', $report->unmappedBrands) ?: '-'],
            ['Skipped SKUs', count($report->skippedSkus)],
        ]);

        foreach ($report->negativeMargin as $row) {
            $this->warn("  NEGATIVE MARGIN: {$row['product']} ({$row['sku']}) cost {$row['cost']} > member price {$row['price_member']}");
        }
    }

    /**
     * @param  array<int,SyncProductsReportDTO>  $reports
     */
    private function sendDiscordReport(DiscordWebhookService $discord, array $reports): void
    {
        $fields = [];
        $hasNegativeMargin = false;

        foreach ($reports as $report) {
            $newList = array_slice(
                array_map(fn ($p) => "`{$p['sku']}` {$p['name']}", $report->newProducts),
                0,
                15
            );
            $extra = count($report->newProducts) - count($newList);

            $fields[] = [
                'name' => strtoupper($report->type),
                'value' => "SKU: {$report->totalFetched} • Harga berubah: {$report->priceChangedCount} • "
                    .'Baru: '.count($report->newProducts).' • Nonaktif: '.count($report->deactivated)
                    .' • Aktif lagi: '.count($report->reactivated),
                'inline' => false,
            ];

            if ($newList !== []) {
                $fields[] = [
                    'name' => '🆕 Produk baru (nonaktif, perlu review)',
                    'value' => implode("\n", $newList).($extra > 0 ? "\n… +{$extra} lainnya" : ''),
                    'inline' => false,
                ];
            }

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

            if ($report->unmappedBrands !== []) {
                $fields[] = [
                    'name' => '🏷️ Brand tanpa mapping kategori',
                    'value' => implode(', ', array_slice($report->unmappedBrands, 0, 30)),
                    'inline' => false,
                ];
            }
        }

        $discord->sendEmbed(
            '📦 Laporan Sinkronisasi Digiflazz',
            $fields,
            $hasNegativeMargin ? DiscordWebhookService::COLOR_ORANGE : DiscordWebhookService::COLOR_GREEN
        );
    }
}
