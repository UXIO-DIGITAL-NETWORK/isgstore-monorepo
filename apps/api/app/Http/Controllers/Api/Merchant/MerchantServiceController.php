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

    public function subscriptions(Request $request)
    {
        $subscriptions = ServiceSubscription::query()
            // Scoped to the caller before any filter, so no query parameter can
            // widen it to another client's rows.
            ->where('merchant_id', $request->user()->id)
            ->with(['service:id,code,name,category', 'invoice:id,invoice_number'])
            ->when($request->query('status'), fn (Builder $q, $s) => $q->where('status', $s))
            ->orderByDesc('ends_at')
            ->paginate(min(100, max(1, (int) $request->query('per_page', 20))));

        return $this->paginatedResponse(
            ServiceSubscriptionResource::collection($subscriptions),
            'Subscriptions retrieved successfully'
        );
    }
}
