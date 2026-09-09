<?php

namespace App\Http\Controllers\Api\Hub;

use App\Actions\Hub\ApplyHubLicenceAction;
use App\Actions\Hub\SyncCatalogFromHubAction;
use App\Actions\Hub\SyncChannelSettingsFromHubAction;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * The Hub telling this site its config changed. The payload names WHAT changed,
 * never the change itself — we still pull the catalog and the fee schedule
 * ourselves, with our own key, exactly as the scheduler does. So the worst a
 * caller can achieve here is making us do the thing we were going to do anyway
 * within 15 minutes, which is why the read key alone gates it.
 *
 * Runs INLINE, not queued. It used to dispatch RunHubSyncJob so the Hub's
 * request returned at once, but that made a config change depend on this site's
 * queue worker being alive — and when it was not, the Hub saw its 202, logged a
 * green row, and the fee sat unchanged with nothing anywhere reporting a
 * problem. The work is two GETs and a handful of upserts, well under a second,
 * so there was never much to defer.
 *
 * The response is therefore the answer itself: `applied` tells the Hub whether
 * the config is now live, which no acknowledgement round-trip can beat.
 *
 * A failure is reported as 200 with `applied: false`, not as an error status.
 * Reaching us and failing to apply are different facts, and the Hub records
 * them in different columns; a 4xx here would blame the delivery for what was
 * really a pull that did not land.
 */
class HubSyncTriggerController extends Controller
{
    use ApiResponse;

    public function trigger(
        Request $request,
        SyncChannelSettingsFromHubAction $channels,
        SyncCatalogFromHubAction $catalog,
        ApplyHubLicenceAction $licence,
    ) {
        $validated = $request->validate([
            'targets' => ['sometimes', 'array'],
            'targets.*' => ['string', 'in:channels,catalog,licence'],
        ]);

        $targets = array_values(array_unique($validated['targets'] ?? ['channels', 'catalog', 'licence']));

        $results = [];

        try {
            if (in_array('channels', $targets, true)) {
                $results['channels'] = $channels->execute();
            }

            if (in_array('catalog', $targets, true)) {
                $results['catalog'] = $catalog->execute();
            }

            // The Hub pokes this one the moment an operator suspends or renews,
            // so a client's site comes back within a second of being paid for
            // rather than at the next five-minute tick.
            if (in_array('licence', $targets, true)) {
                $results['licence'] = $licence->execute();
            }
        } catch (Throwable $e) {
            Log::error('Hub sync (poked) failed', ['targets' => $targets, 'error' => $e->getMessage()]);

            return $this->successResponse([
                'applied' => false,
                'targets' => $targets,
                'error' => $e->getMessage(),
            ], 'Sinkronisasi gagal — jadwal 15 menit masih berjalan sebagai cadangan');
        }

        Log::info('Hub sync (poked) applied', ['targets' => $targets]);

        return $this->successResponse([
            'applied' => true,
            'targets' => $targets,
            'results' => $results,
        ], 'Sinkronisasi diterapkan');
    }
}
