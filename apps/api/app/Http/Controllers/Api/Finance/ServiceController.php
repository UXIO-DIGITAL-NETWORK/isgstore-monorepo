<?php

namespace App\Http\Controllers\Api\Finance;

use App\Actions\Service\CreateServiceAction;
use App\Actions\Service\DeleteServiceAction;
use App\Actions\Service\UpdateServiceAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Service\StoreServiceRequest;
use App\Http\Requests\Service\UpdateServiceRequest;
use App\Http\Resources\Api\Service\ServiceResource;
use App\Models\Service;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * Kita's catalogue of services sold to payment-page clients — pricing and the
 * length of one subscription period.
 */
class ServiceController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $services = Service::query()
            ->with('paymentChannel:id,name')
            ->when($request->query('search'), fn (Builder $q, $s) => $q->where(
                fn (Builder $inner) => $inner->where('name', 'like', "%{$s}%")->orWhere('code', 'like', "%{$s}%")
            ))
            ->when($request->query('category'), fn (Builder $q, $c) => $q->where('category', $c))
            ->when(
                $request->has('is_active'),
                fn (Builder $q) => $q->where('is_active', $request->boolean('is_active'))
            )
            ->orderBy('sort_order')
            ->orderBy('id')
            ->paginate(min(100, max(1, (int) $request->query('per_page', 20))));

        return $this->paginatedResponse(
            ServiceResource::collection($services),
            'Services retrieved successfully'
        );
    }

    public function store(StoreServiceRequest $request, CreateServiceAction $action)
    {
        $service = $action->execute($request->validated());

        return $this->successResponse(
            new ServiceResource($service->load('paymentChannel:id,name')),
            'Service berhasil dibuat',
            201
        );
    }

    public function show(Service $service)
    {
        return $this->successResponse(
            new ServiceResource($service->load('paymentChannel:id,name')),
            'Service retrieved successfully'
        );
    }

    public function update(UpdateServiceRequest $request, Service $service, UpdateServiceAction $action)
    {
        $updated = $action->execute($service, $request->validated());

        return $this->successResponse(
            new ServiceResource($updated->load('paymentChannel:id,name')),
            'Service berhasil diperbarui'
        );
    }

    public function destroy(Service $service, DeleteServiceAction $action)
    {
        try {
            $action->execute($service);
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(null, 'Service berhasil dihapus');
    }
}
