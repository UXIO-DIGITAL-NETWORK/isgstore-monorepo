<?php

namespace App\Console\Commands;

use App\Actions\Hub\ApplyHubLicenceAction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Pulls this site's own licence from the Hub — scheduled every five minutes.
 *
 * Tighter than the 15-minute catalog sync on purpose: this one decides whether
 * the site serves the public at all. Fifteen minutes of a suspended site still
 * taking orders is the difference between a lever and a suggestion, and the
 * cost of the tighter loop is one GET.
 */
class SyncHubLicenceCommand extends Command
{
    protected $signature = 'hub:sync-licence';

    protected $description = "Pull this site's licence term and serving state from the Hub";

    public function handle(ApplyHubLicenceAction $action): int
    {
        try {
            $report = $action->execute();
        } catch (Throwable $e) {
            // The previously synced answer stands — a Hub we cannot reach must
            // not change whether this site serves.
            $this->error("Hub licence sync failed: {$e->getMessage()}");
            Log::error('hub:sync-licence failed', ['error' => $e->getMessage()]);

            return self::FAILURE;
        }

        $this->info(sprintf(
            'Lisensi selaras: %s%s, berakhir %s.',
            $report['status'],
            $report['suspended'] ? ' (dinonaktifkan)' : '',
            $report['ends_at'] ?? '-',
        ));

        return self::SUCCESS;
    }
}
