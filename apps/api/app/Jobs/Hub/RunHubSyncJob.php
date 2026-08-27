<?php

declare(strict_types=1);

namespace App\Jobs\Hub;

use App\Actions\Hub\SyncCatalogFromHubAction;
use App\Actions\Hub\SyncChannelSettingsFromHubAction;
use App\Services\DiscordWebhookService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Runs the same pulls the 15-minute scheduler runs, on demand — dispatched when
 * the Hub pokes us to say its config changed.
 *
 * Queued rather than inline so the Hub's request returns immediately and a slow
 * or unreachable Hub cannot turn a poke into a hung HTTP call. ShouldBeUnique
 * for a minute is the idempotency: an admin saving five rows in a row produces
 * five pokes and exactly one sync.
 *
 * Failure is safe by construction — HubClient throws on a non-2xx AND on a 200
 * carrying an error envelope, both before the sync's transaction opens, so a
 * failed run changes nothing and the scheduler heals it within 15 minutes.
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
    ): void {
        if (in_array('channels', $this->targets, true)) {
            Log::info('Hub sync (poked): channels', $channels->execute());
        }

        if (in_array('catalog', $this->targets, true)) {
            Log::info('Hub sync (poked): catalog', $catalog->execute());
        }
    }

    public function failed(Throwable $e): void
    {
        Log::error('Hub sync (poked) failed', ['targets' => $this->targets, 'error' => $e->getMessage()]);

        app(DiscordWebhookService::class)->sendAlert(
            'Sinkronisasi dari Hub gagal setelah dipicu: '.$e->getMessage()
            .' — jadwal 15 menit masih berjalan sebagai cadangan.'
        );
    }
}
