<?php

namespace App\Console\Commands;

use App\Actions\Hub\SyncChannelSettingsFromHubAction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Pulls the channel fee schedule (MDR, admin fee, tax, enablement, minimum)
 * from the Hub — the effective per-site values, overrides already applied.
 * A code the site has never seen is created; one absent from the Monetapay
 * contract is created INACTIVE. Logo, sort order, description and payment_type
 * of an existing row stay local.
 */
class SyncHubChannelsCommand extends Command
{
    protected $signature = 'hub:sync-channels';

    protected $description = 'Pull the channel fee schedule from the Hub (fees, enablement, minimum; creates unknown channels inactive)';

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
            'Biaya channel selaras: %d dibuat, %d diperbarui, %d dilewati (payload tanpa nama/tipe).',
            $report['created'],
            $report['updated'],
            $report['skipped'],
        ));

        return self::SUCCESS;
    }
}
