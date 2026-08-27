<?php

namespace App\Http\Controllers\Api\Hub;

use App\Http\Controllers\Controller;
use App\Jobs\Hub\RunHubSyncJob;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

/**
 * The Hub telling this site its config changed. The payload names WHAT changed,
 * never the change itself — we still pull the catalog and the fee schedule
 * ourselves, with our own key, exactly as the scheduler does. So the worst a
 * caller can achieve here is making us do the thing we were going to do anyway
 * within 15 minutes, which is why the read key alone gates it.
 *
 * Always queued: the Hub gets a 202 straight away, and a slow Hub can never
 * hold its own request open waiting for us to call it back.
 */
class HubSyncTriggerController extends Controller
{
    use ApiResponse;

    public function trigger(Request $request)
    {
        $validated = $request->validate([
            'targets' => ['sometimes', 'array'],
            'targets.*' => ['string', 'in:channels,catalog'],
        ]);

        $targets = array_values(array_unique($validated['targets'] ?? ['channels', 'catalog']));

        RunHubSyncJob::dispatch($targets);

        return $this->successResponse(
            ['queued' => true, 'targets' => $targets],
            'Sinkronisasi dijadwalkan',
            202
        );
    }
}
