<?php

namespace App\Console\Commands;

use App\Actions\Hub\SyncCatalogFromHubAction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Pulls the service catalog from the Hub and aligns the local copy — scheduled
 * every minute when hub integration is enabled; also runnable by hand
 * after changing the catalog at the Hub.
 */
class SyncHubCatalogCommand extends Command
{
    protected $signature = 'hub:sync-catalog';

    protected $description = 'Pull the service catalog from the Hub and align the local copy (never deletes)';

    public function handle(SyncCatalogFromHubAction $action): int
    {
        try {
            $report = $action->execute();
        } catch (Throwable $e) {
            $this->error("Hub catalog sync failed: {$e->getMessage()}");
            Log::error('hub:sync-catalog failed', ['error' => $e->getMessage()]);

            return self::FAILURE;
        }

        $this->info(sprintf(
            'Katalog selaras: %d dibuat, %d diperbarui, %d dinonaktifkan.',
            $report['created'],
            $report['updated'],
            $report['deactivated'],
        ));

        return self::SUCCESS;
    }
}
