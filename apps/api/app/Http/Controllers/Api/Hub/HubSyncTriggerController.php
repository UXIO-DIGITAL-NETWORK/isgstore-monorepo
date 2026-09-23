<?php

namespace App\Http\Controllers\Api\Hub;

use App\Actions\Hub\ApplyHubLicenceAction;
use App\Actions\Hub\ApplyHubPlanAction;
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
 * within a minute, which is why the read key alone gates it.
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
        ApplyHubPlanAction $plan,
    ) {
        $validated = $request->validate([
            'targets' => ['sometimes', 'array'],
            // `plan` is accepted but the Hub does not send it yet: an unknown
            // target 422s this whole request, so every site must be able to
            // ACCEPT it before any Hub starts sending it. Until then the plan
            // sync rides along with `licence`, which is the target the Hub
            // already pokes on exactly the events that change a plan.
            'targets.*' => ['string', 'in:channels,catalog,licence,plan'],
        ]);

        $targets = array_values(array_unique($validated['targets'] ?? ['channels', 'catalog', 'licence']));

        // Reported back on every answer, applied or not: a Hub that asked for a
        // plan sync has to be able to tell "the site is not armed to issue bills"
        // from "the site is fine and the bill is on its way". Without it, a poke
        // against a site with HUB_MANAGED_PLAN off looks like a healthy sync.
        $planEnabled = (bool) config('services.hub.managed_plan');

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
            // rather than at the next minute's tick.
            if (in_array('licence', $targets, true)) {
                $results['licence'] = $licence->execute();
            }

            // Rides along with `licence` until every site accepts a `plan`
            // target of its own — a plan change IS a licence-adjacent event, and
            // the alternative was a poke that 422s on any site a release behind.
            if ($planEnabled
                && (in_array('plan', $targets, true) || in_array('licence', $targets, true))) {
                $results['plan'] = $plan->execute();
            }
        } catch (Throwable $e) {
            Log::error('Hub sync (poked) failed', ['targets' => $targets, 'error' => $e->getMessage()]);

            return $this->successResponse([
                'applied' => false,
                'plan_enabled' => $planEnabled,
                'targets' => $targets,
                'error' => $e->getMessage(),
            ], 'Sinkronisasi gagal — jadwal 1 menit masih berjalan sebagai cadangan');
        }

        Log::info('Hub sync (poked) applied', ['targets' => $targets]);

        return $this->successResponse([
            'applied' => true,
            'plan_enabled' => $planEnabled,
            'targets' => $targets,
            'results' => $results,
        ], 'Sinkronisasi diterapkan');
    }
}
