<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\HubClient;
use Illuminate\Console\Command;
use Throwable;

/**
 * The release gate for the site→Hub link. Exits non-zero when this site cannot
 * reach the Hub, so a pipeline can stop before shipping a build whose whole
 * reporting loop is dead.
 *
 * `hub:status` prints the same live probe but always exits zero — it is a
 * diagnostic to read. This is the check a deploy can act on.
 *
 * Inert on a standalone deployment (HUB_ENABLED=false): there is no Hub to
 * reach, so "not connected" is the correct, passing state.
 */
class HubPingCommand extends Command
{
    protected $signature = 'hub:ping';

    protected $description = 'Fail (exit 1) when HUB_ENABLED but the Hub cannot be reached';

    public function handle(HubClient $hub): int
    {
        if (! config('services.hub.enabled')) {
            $this->info('HUB_ENABLED=false — standalone, tidak ada Hub untuk dihubungi. Lulus.');

            return self::SUCCESS;
        }

        $baseUrl = rtrim((string) config('services.hub.base_url'), '/');
        $this->line('Menghubungi Hub: '.($baseUrl !== '' ? $baseUrl : '(HUB_BASE_URL kosong)'));

        try {
            $rows = $hub->catalog();
        } catch (Throwable $e) {
            $this->error('GAGAL — '.$e->getMessage());
            $this->warn('Cek HUB_BASE_URL, HUB_SITE_API_KEY, dan izin IP di sisi Hub.');

            return self::FAILURE;
        }

        $this->info('OK — '.count($rows).' baris katalog diterima.');

        return self::SUCCESS;
    }
}
