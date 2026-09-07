<?php

namespace App\Http\Controllers\Api\Finance;

use App\Actions\Service\CancelServiceSubscriptionAction;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\Service\ServiceSubscriptionResource;
use App\Models\ServiceSubscription;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use RuntimeException;

/** Kita's view of who subscribes to what, and for how long. */
class ServiceSubscriptionController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $subscriptions = ServiceSubscription::query()
            ->with(['merchant:id,name', 'service:id,code,name,category', 'invoice:id,invoice_number'])
            ->when($request->query('merchant_id'), fn (Builder $q, $id) => $q->where('merchant_id', $id))
            ->when($request->query('service_id'), fn (Builder $q, $id) => $q->where('service_id', $id))
            ->when($request->query('status'), fn (Builder $q, $s) => $q->where('status', $s))
            ->latest('id')
            ->paginate(min(100, max(1, (int) $request->query('per_page', 20))));

        return $this->paginatedResponse(
            ServiceSubscriptionResource::collection($subscriptions),
            'Service subscriptions retrieved successfully'
        );
    }

    public function show(ServiceSubscription $serviceSubscription)
    {
        return $this->successResponse(
            new ServiceSubscriptionResource(
                $serviceSubscription->load(['merchant:id,name,email', 'service:id,code,name,category', 'invoice:id,invoice_number'])
            ),
            'Subscription retrieved successfully'
        );
    }

    public function cancel(ServiceSubscription $serviceSubscription, CancelServiceSubscriptionAction $action)
    {
        try {
            $cancelled = $action->execute($serviceSubscription);
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(
            new ServiceSubscriptionResource($cancelled->load(['merchant:id,name', 'service:id,code,name,category'])),
            'Langganan dibatalkan'
        );
    }
}
