<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\HubPlanItem;
use App\Models\Service;
use App\Models\ServiceInvoice;
use App\Services\HubClient;
use App\Support\Hub\HubSyncSchedule;
use Illuminate\Console\Command;
use Illuminate\Database\QueryException;
use Throwable;

/**
 * One command that answers "kenapa tagihannya tidak muncul di halaman klien".
 *
 * The failure this exists for is silent by construction: with HUB_ENABLED off
 * the scheduler registers nothing, with HUB_MANAGED_PLAN off the plan sync never
 * issues a bill, and a plan row naming a service the local catalog has not seen
 * is skipped with nothing but a log line. None of those raise an error — the
 * payment page just stays empty. So this prints the config, probes the Hub live,
 * and counts what actually landed in `hub_plan_items` and `service_invoices`.
 */
class HubStatusCommand extends Command
{
    protected $signature = 'hub:status';

    protected $description = 'Report whether this site is wired to the Uxio Hub and can issue Hub plan invoices';

    public function handle(HubClient $hub): int
    {
        $baseUrl = rtrim((string) config('services.hub.base_url'), '/');
        $apiKey = (string) config('services.hub.api_key');

        $this->line('Konfigurasi');
        $this->table(['Setelan', 'Nilai'], [
            ['HUB_ENABLED', config('services.hub.enabled') ? 'true' : 'false'],
            ['HUB_BASE_URL', $baseUrl !== '' ? $baseUrl : '(kosong)'],
            ['HUB_SITE_API_KEY', $apiKey !== '' ? substr($apiKey, 0, 12).'…' : '(kosong)'],
            ['HUB_MANAGED_CATALOG', config('services.hub.managed_catalog') ? 'true' : 'false'],
            ['HUB_MANAGED_CHANNELS', config('services.hub.managed_channels') ? 'true' : 'false'],
            ['HUB_MANAGED_LICENCE', config('services.hub.managed_licence') ? 'true' : 'false'],
            ['HUB_MANAGED_PLAN', config('services.hub.managed_plan') ? 'true' : 'false'],
            ['Interval sinkronisasi', HubSyncSchedule::intervalMinutes().' menit'],
        ]);

        if (! config('services.hub.enabled')) {
            $this->warn('HUB_ENABLED=false — blok scheduler hub:sync-* tidak terdaftar, jadi tidak ada yang menarik paket dan tagihan tidak akan terbit sendiri.');
        }

        if (! config('services.hub.managed_plan')) {
            $this->warn('HUB_MANAGED_PLAN=false — paket Hub tidak pernah diterjemahkan jadi tagihan, walau situs sudah tersambung.');
        }

        $this->newLine();
        $this->line('Koneksi ke Hub (live)');
        $this->probe($hub, 'catalog');
        $this->probe($hub, 'plan');

        // Wrapped because an unreachable DB is one of the things this command
        // exists to diagnose — a stack trace would bury the live probe above,
        // which is usually the answer.
        try {
            $this->reportPlanCache();
            $this->reportInvoices();
        } catch (QueryException $e) {
            $this->newLine();
            $this->error('Database tidak bisa dibaca: '.$e->getMessage());
            $this->warn('Cek koneksi DB dan jalankan `php artisan migrate` — tanpa tabelnya tidak ada tagihan untuk dilihat.');
        }

        return self::SUCCESS;
    }

    private function reportPlanCache(): void
    {
        $this->newLine();
        $this->line('Cache paket (hub_plan_items)');

        $planCodes = HubPlanItem::query()->distinct()->pluck('service_code');
        $missing = $planCodes
            ->diff(Service::query()->whereIn('code', $planCodes)->pluck('code'))
            ->values();

        $this->table(['Metrik', 'Nilai'], [
            ['Baris paket', (string) HubPlanItem::query()->count()],
            ['Sinkron terakhir', (string) (HubPlanItem::query()->max('synced_at') ?? 'belum pernah')],
            ['Kode layanan belum ada di katalog situs', $missing->isEmpty() ? '0' : $missing->implode(', ')],
        ]);

        if ($missing->isNotEmpty()) {
            $this->warn('Kode di atas belum ada di katalog lokal — `hub:sync-catalog` dulu, kalau tidak barisnya dilewati tanpa tagihan.');
        }
    }

    private function reportInvoices(): void
    {
        $this->newLine();
        $this->line('Tagihan Hub (service_invoices source=hub_plan)');

        $rows = ServiceInvoice::query()
            ->where('source', 'hub_plan')
            ->selectRaw('status, count(*) as total, coalesce(sum(amount), 0) as amount')
            ->groupBy('status')
            ->orderBy('status')
            ->get();

        if ($rows->isEmpty()) {
            $this->warn('Belum ada tagihan dari paket Hub. Kalau situs sudah tersambung dan paketnya sudah ditarik, cek HUB_MANAGED_PLAN.');

            return;
        }

        $this->table(
            ['Status', 'Jumlah', 'Total'],
            $rows->map(fn ($row) => [$row->status, (string) $row->total, 'Rp '.number_format((int) $row->amount, 0, ',', '.')])->all(),
        );
    }

    /** A live read, so the report never vouches for a Hub it never reached. */
    private function probe(HubClient $hub, string $target): void
    {
        try {
            $rows = $hub->{$target}();
            $this->info("  {$target}: OK — ".count($rows).' baris');
        } catch (Throwable $e) {
            $this->error("  {$target}: GAGAL — {$e->getMessage()}");
        }
    }
}
