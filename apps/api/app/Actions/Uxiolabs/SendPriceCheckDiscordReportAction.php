<?php

namespace App\Actions\Uxiolabs;

use App\DTOs\Uxiolabs\PriceCheckReportDTO;
use App\Services\DiscordWebhookService;

/**
 * Posts one price-check report to Discord.
 *
 * Shared by the 5-minute schedule and the manual run, so the two can never
 * describe the same run differently: every number, margin row and failed SKU in
 * the embed comes from the one `PriceCheckReportDTO`.
 *
 * **The scheduled run posts on every tick**, which is 288 messages a day. That is
 * a deliberate choice for this channel rather than an oversight — the schedule
 * used to speak up only when the command crashed, and this is the switch that
 * makes it report. If the channel ever gets noisy, throttle HERE: the run is
 * summarised in one embed and the source is in the title, so a "changed only"
 * filter or a digest is a change to this class and nothing else.
 */
class SendPriceCheckDiscordReportAction
{
    /** Shown in the title so a scheduled run and a hand-run are told apart. */
    public const SOURCE_SCHEDULED = 'terjadwal';

    public const SOURCE_MANUAL = 'manual';

    public function __construct(private readonly DiscordWebhookService $discord) {}

    public function execute(PriceCheckReportDTO $report, string $source = self::SOURCE_SCHEDULED): void
    {
        $discord = $this->discord;

        if ($report->skippedReason !== null) {
            // Another run held the lock, so this tick did nothing. Not an alarm —
            // the run it collided with reports what actually happened — but the
            // channel should not simply go silent for a tick either.
            $discord->sendEmbed(
                $this->title($source),
                [],
                DiscordWebhookService::COLOR_BLUE,
                "Dilewati: {$report->skippedReason}"
            );

            return;
        }

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

        // Orange when a human has something to do — a margin under cost, a SKU the
        // provider switched off, a price we could not write. Green otherwise, which
        // on a scheduled tick means "checked, nothing to do".
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
                'name' => 'ℹ️ Contoh layanan Uxiotopup yang belum ditambahkan',
                'value' => '`'.implode('`, `', array_slice($report->unknownSkusSample, 0, 20)).'`'
                    .($report->unknownCount > 20 ? " … total {$report->unknownCount}" : ''),
                'inline' => false,
            ];
        }

        $discord->sendEmbed(
            $this->title($source),
            $fields,
            $needsAttention ? DiscordWebhookService::COLOR_ORANGE : DiscordWebhookService::COLOR_GREEN
        );
    }

    private function title(string $source): string
    {
        return "[UXIOTOPUP] 📦 Laporan Cek Harga ({$source})";
    }
}
