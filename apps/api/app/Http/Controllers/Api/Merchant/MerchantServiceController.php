<?php

namespace App\Http\Controllers\Api\Merchant;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\Service\ServiceResource;
use App\Http\Resources\Api\Service\ServiceSubscriptionResource;
use App\Models\Service;
use App\Models\ServiceSubscription;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

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
