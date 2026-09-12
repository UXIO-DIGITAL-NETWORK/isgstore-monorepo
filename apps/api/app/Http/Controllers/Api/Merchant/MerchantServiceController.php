<?php

namespace App\Http\Controllers\Api\Merchant;

use App\Enums\ServiceInvoiceStatus;
use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\Service\ServiceCheckoutResource;
use App\Http\Resources\Api\Service\ServiceResource;
use App\Http\Resources\Api\Service\ServiceSubscriptionResource;
use App\Models\Service;
use App\Models\ServiceInvoice;
use App\Models\ServiceSubscription;
use App\Support\Payment\WebsiteService;
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
