<?php

namespace App\Http\Controllers\Api\Merchant;

use App\Enums\ServiceInvoiceStatus;
use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\Service\ServiceCheckoutResource;
use App\Http\Resources\Api\Service\ServiceResource;
use App\Http\Resources\Api\Service\ServiceSubscriptionResource;
use App\Models\HubPlanItem;
use App\Models\Service;
use App\Models\ServiceInvoice;
use App\Models\ServiceSubscription;
use App\Support\Payment\WebsiteService;
use App\Support\SiteLicenceState;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * The client's view: what it can buy, and what it currently holds.
 */
class MerchantServiceController extends Controller
{
    use ApiResponse;

    /** Active catalogue only — a deactivated service must not be orderable. */
    public function catalog(Request $request)
    {
        $services = Service::query()
            ->where('is_active', true)
            ->when($request->query('category'), fn (Builder $q, $c) => $q->where('category', $c))
            ->orderBy('sort_order')
            ->orderBy('id')
            ->paginate(min(100, max(1, (int) $request->query('per_page', 20))));

        return $this->paginatedResponse(
            ServiceResource::collection($services),
            'Services retrieved successfully'
        );
    }

    /**
     * One catalogue entry for the checkout page, with the period confirmation
     * would open and whether an unpaid bill is already in the way.
     */
    public function show(Request $request, Service $service)
    {
        // A deactivated service must not be reachable by deep link either.
        abort_unless($service->is_active, 404);

        $merchantId = $request->user()->id;

        $currentEndsAt = ServiceSubscription::query()
            ->where('merchant_id', $merchantId)
            ->where('service_id', $service->id)
            ->where('status', SubscriptionStatus::ACTIVE)
            ->max('ends_at');

        $openInvoiceId = ServiceInvoice::query()
            ->where('merchant_id', $merchantId)
            ->where('service_id', $service->id)
            ->whereIn('status', [ServiceInvoiceStatus::UNPAID, ServiceInvoiceStatus::WAITING_CONFIRMATION])
            ->value('id');

        return $this->successResponse(
            new ServiceCheckoutResource(
                $service,
                $currentEndsAt ? Carbon::parse($currentEndsAt) : null,
                $openInvoiceId ? (int) $openInvoiceId : null,
            ),
            'Service retrieved successfully'
        );
    }

    /**
     * The client's own subscriptions.
     *
     * One wrinkle worth naming: this site's OWN licence can be represented
     * twice — the row the Hub mirrors down (`source = hub`) and, once the client
     * has paid for a renewal here, the invoice-backed row that payment created.
     * Both are true, and every reader elsewhere takes `max(ends_at)` so no total
     * is ever wrong; but showing the client two cards for one subscription just
     * looks like a bug. So the shorter one is dropped from THIS list only, in
     * the controller rather than the resource, because it is a decision about
     * the collection and a resource cannot see its siblings.
     */
    /**
     * "What am I subscribed to, and what must I renew — and when."
     *
     * One row per service in the Hub's plan for this site, whether or not it has
     * ever been paid for. The subscriptions tab could not answer this: a period
     * nobody has paid yet has no `service_subscriptions` row at all, so the very
     * thing a client needs to see was the one thing missing.
     *
     * Read entirely from the LOCAL cache of the plan — no Hub call on a page
     * load, and the page keeps working through a Hub outage.
     */
    public function plan(Request $request)
    {
        $merchantId = $request->user()->id;

        // Resolved once: "the service that is this site's own licence". See the
        // per-line use below.
        $licenceCode = WebsiteService::code();

        $items = HubPlanItem::query()
            ->orderBy('service_code')
            ->orderBy('period_index')
            ->get()
            ->groupBy('service_code');

        $invoices = ServiceInvoice::query()
            ->where('merchant_id', $merchantId)
            ->whereNotNull('hub_item_key')
            ->get()
            ->keyBy('hub_item_key');

        $held = ServiceSubscription::query()
            ->where('merchant_id', $merchantId)
            ->where('status', SubscriptionStatus::ACTIVE)
            ->with('service:id,code')
            ->get()
            ->groupBy(fn (ServiceSubscription $s) => $s->service?->code ?? '');

        $rows = $items->map(function ($periods, string $code) use ($invoices, $held) {
            /** @var HubPlanItem $latest */
            $latest = $periods->sortByDesc('period_index')->first();

            $outstanding = $periods
                ->map(fn (HubPlanItem $p) => $invoices->get($p->item_key))
                ->filter(fn (?ServiceInvoice $i) => $i !== null && $i->status === ServiceInvoiceStatus::UNPAID)
                ->values();

            // The furthest paid-for date, from the subscriptions actually held —
            // which for the website service is the Hub's own mirrored term.
            //
            // A LIFETIME row has no date at all, and `max('ends_at')` returns null
            // for it — the same null that means "never subscribed". So the flag
            // travels BESIDE the date: without it, a client who bought their
            // licence outright reads as unpaid in their own panel, which is the
            // one screen that should be confirming they paid.
            $heldForService = $held[$code] ?? collect();
            $lifetime = $heldForService->contains(fn (ServiceSubscription $s) => $s->isLifetime());
            $activeUntil = $lifetime ? null : $heldForService->max('ends_at');

            // This site's own licence lives on the Hub, mirrored into the licence
            // state — while its subscription row is attached to whichever service
            // the site resolved as "its own" (and whichever merchant). A mismatch
            // there made a licence the client had PAID FOR read "Belum pernah
            // dibayar" on the one screen that should confirm it. So the licence
            // line takes the Hub's verdict directly, beside what the
            // subscriptions say. Keyed on the resolved licence code, not
            // `governs_licence`: an item_key the Hub retired is never deleted
            // locally and can sit there still flagged as governing.
            if ($code === $licenceCode && SiteLicenceState::isManaged()) {
                if (SiteLicenceState::isLifetime()) {
                    $lifetime = true;
                    $activeUntil = null;
                } elseif ($activeUntil === null) {
                    $endsAt = SiteLicenceState::closure()['ends_at'];

                    if ($endsAt !== null) {
                        $activeUntil = Carbon::parse($endsAt);
                    }
                }
            }

            return [
                'service_code' => $code,
                'service_name' => $latest->service_name,
                'billing_mode' => $latest->billing_mode,
                'amount' => (int) $latest->amount,
                'duration_days' => (int) $latest->duration_days,
                'governs_licence' => (bool) $latest->governs_licence,
                'is_active' => (bool) $latest->is_active,
                'active_until' => $activeUntil?->toIso8601String(),
                'lifetime' => $lifetime,
                'next_period_starts_at' => $latest->period_starts_at?->toIso8601String(),
                'next_due_at' => $outstanding->min('due_at')?->toIso8601String(),
                'outstanding_total' => (int) $outstanding->sum('amount'),
                'outstanding' => $outstanding->map(fn (ServiceInvoice $i) => [
                    'id' => $i->id,
                    'invoice_number' => $i->invoice_number,
                    'amount' => (int) $i->amount,
                    'due_at' => $i->due_at?->toIso8601String(),
                    'period_starts_at' => $i->period_starts_at?->toIso8601String(),
                    'period_ends_at' => $i->period_ends_at?->toIso8601String(),
                ])->values(),
            ];
        })->values();

        return $this->successResponse($rows, 'Service plan');
    }

    public function subscriptions(Request $request)
    {
        $subscriptions = ServiceSubscription::query()
            // Scoped to the caller before any filter, so no query parameter can
            // widen it to another client's rows.
            ->where('merchant_id', $request->user()->id)
            ->with(['service:id,code,name,category', 'invoice:id,invoice_number'])
            ->when($request->query('status'), fn (Builder $q, $s) => $q->where('status', $s))
            ->whereNotIn('id', $this->supersededWebsiteRows($request->user()->id))
            ->orderByDesc('ends_at')
            ->paginate(min(100, max(1, (int) $request->query('per_page', 20))));

        return $this->paginatedResponse(
            ServiceSubscriptionResource::collection($subscriptions),
            'Subscriptions retrieved successfully'
        );
    }

    /**
     * Website-service rows this client holds other than the furthest-reaching
     * one — the duplicates described above. Returns nothing at all when there is
     * only one, which is the normal case.
     *
     * @return list<int>
     */
    private function supersededWebsiteRows(int $merchantId): array
    {
        $service = WebsiteService::get();

        if (! $service) {
            return [];
        }

        $rows = ServiceSubscription::query()
            ->where('merchant_id', $merchantId)
            ->where('service_id', $service->id)
            ->orderByDesc('ends_at')
            ->pluck('id');

        return $rows->count() > 1 ? $rows->skip(1)->values()->all() : [];
    }
}
