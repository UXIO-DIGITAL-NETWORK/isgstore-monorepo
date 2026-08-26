<?php

namespace App\Console\Commands;

use App\Actions\Hub\SyncChannelSettingsFromHubAction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Pulls the channel fee schedule (MDR, admin fee, tax) from the Hub — the
 * effective per-site values, overrides already applied. `is_active` and other
 * local columns are never touched.
 */
class SyncHubChannelsCommand extends Command
{
    protected $signature = 'hub:sync-channels';

    protected $description = 'Pull the channel fee settings from the Hub (fees only; is_active stays local)';

    public function handle(SyncChannelSettingsFromHubAction $action): int
    {
        try {
            $report = $action->execute();
        } catch (Throwable $e) {
            $this->error("Hub channel sync failed: {$e->getMessage()}");
            Log::error('hub:sync-channels failed', ['error' => $e->getMessage()]);

            return self::FAILURE;
        }

        $this->info(sprintf(
            'Biaya channel selaras: %d diperbarui, %d dilewati (tidak dikonfigurasi lokal).',
            $report['updated'],
            $report['skipped'],
        ));

        return self::SUCCESS;
    }
}
