<?php

namespace App\Http\Controllers\Api\Finance;

use App\Actions\Incident\CreateIncidentAction;
use App\Actions\Incident\DeleteIncidentAction;
use App\Actions\Incident\UpdateIncidentAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Incident\StoreIncidentRequest;
use App\Http\Requests\Incident\UpdateIncidentRequest;
use App\Http\Resources\Api\Service\ServiceIncidentResource;
use App\Models\ServiceIncident;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

/**
 * Kita writes the disruptions its clients see on their Status Layanan page.
 */
class ServiceIncidentController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $incidents = ServiceIncident::query()
            ->with(['service:id,name', 'paymentChannel:id,name'])
            ->when($request->query('status'), fn (Builder $q, $s) => $q->where('status', $s))
            ->when($request->query('severity'), fn (Builder $q, $s) => $q->where('severity', $s))
            ->orderByDesc('started_at')
            ->paginate(min(100, max(1, (int) $request->query('per_page', 20))));

        return $this->paginatedResponse(
            ServiceIncidentResource::collection($incidents),
            'Incidents retrieved successfully'
        );
    }

    public function store(StoreIncidentRequest $request, CreateIncidentAction $action)
    {
        $incident = $action->execute($request->validated() + ['created_by' => $request->user()->id]);

        return $this->successResponse(
            new ServiceIncidentResource($incident->load(['service:id,name', 'paymentChannel:id,name'])),
            'Insiden berhasil dibuat',
            201
        );
    }

    public function show(ServiceIncident $serviceIncident)
    {
        return $this->successResponse(
            new ServiceIncidentResource($serviceIncident->load(['service:id,name', 'paymentChannel:id,name'])),
            'Incident retrieved successfully'
        );
    }

    public function update(UpdateIncidentRequest $request, ServiceIncident $serviceIncident, UpdateIncidentAction $action)
    {
        $updated = $action->execute($serviceIncident, $request->validated());

        return $this->successResponse(
            new ServiceIncidentResource($updated->load(['service:id,name', 'paymentChannel:id,name'])),
            'Insiden berhasil diperbarui'
        );
    }

    public function destroy(ServiceIncident $serviceIncident, DeleteIncidentAction $action)
    {
        $action->execute($serviceIncident);

        return $this->successResponse(null, 'Insiden berhasil dihapus');
    }
}
