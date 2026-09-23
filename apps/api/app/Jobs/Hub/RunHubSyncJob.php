<?php

declare(strict_types=1);

namespace App\Jobs\Hub;

use App\Actions\Hub\SyncCatalogFromHubAction;
use App\Actions\Hub\SyncChannelSettingsFromHubAction;
use App\Services\DiscordWebhookService;
use App\Services\HubClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Runs the same pulls the 1-minute scheduler runs, on demand.
 *
 * RETIRED as the poke's execution path: HubSyncTriggerController now applies the
 * sync inline and answers with the outcome, because queuing it made a config
 * change depend on this site's worker being alive — and when it was not, the Hub
 * saw a 202, logged a green row, and the fee sat unchanged with nothing anywhere
 * reporting a problem.
 *
 * Kept for one release for two reasons, both about the deploy window: jobs
 * already serialized in the `jobs` table must drain rather than poison
 * `failed_jobs`, and a Hub on the newer build talking to a site still on this
 * one relies on the ack this job sends. Delete it once every site is past that
 * release — the same treatment RefundGatewayJob got.
 *
 * Failure is safe by construction — HubClient throws on a non-2xx AND on a 200
 * carrying an error envelope, both before the sync's transaction opens, so a
 * failed run changes nothing and the scheduler heals it within a minute.
 */
class RunHubSyncJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [10, 60];

    public int $uniqueFor = 60;

    /** @param list<string> $targets */
    public function __construct(public readonly array $targets = ['channels', 'catalog']) {}

    public function uniqueId(): string
    {
        $targets = $this->targets;
        sort($targets);

        return 'hub-sync:'.implode(',', $targets);
    }

    public function handle(
        SyncChannelSettingsFromHubAction $channels,
        SyncCatalogFromHubAction $catalog,
        HubClient $hub,
    ): void {
        if (in_array('channels', $this->targets, true)) {
            Log::info('Hub sync (poked): channels', $channels->execute());
        }

        if (in_array('catalog', $this->targets, true)) {
            Log::info('Hub sync (poked): catalog', $catalog->execute());
        }

        // Close the loop. Reported only after both pulls committed, so an `ok`
        // here means the config really is live on this site — the one claim the
        // Hub's own 202 could never make. Reporting never throws: a delivered
        // sync must not be retried because its receipt went missing.
        $hub->reportSyncResult($this->targets, 'ok');
    }

    public function failed(Throwable $e): void
    {
        Log::error('Hub sync (poked) failed', ['targets' => $this->targets, 'error' => $e->getMessage()]);

        // Only after retries are exhausted, so the Hub is not told "failed" for
        // an attempt that the next retry will settle.
        app(HubClient::class)->reportSyncResult($this->targets, 'failed', $e->getMessage());

        app(DiscordWebhookService::class)->sendAlert(
            'Sinkronisasi dari Hub gagal setelah dipicu: '.$e->getMessage()
            .' — jadwal 1 menit masih berjalan sebagai cadangan.'
        );
    }
}
