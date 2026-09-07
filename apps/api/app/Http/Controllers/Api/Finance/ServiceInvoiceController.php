<?php

namespace App\Http\Controllers\Api\Finance;

use App\Actions\Service\ConfirmServiceInvoiceAction;
use App\Actions\Service\RejectServiceInvoiceAction;
use App\DTOs\Service\ConfirmServiceInvoiceDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Service\RejectServiceInvoiceRequest;
use App\Http\Resources\Api\Service\ServiceInvoiceResource;
use App\Models\ServiceInvoice;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * Kita's verification queue for service bills: read the bukti transfer a client
 * uploaded, then confirm (which opens the subscription period) or reject.
 */
class ServiceInvoiceController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $invoices = ServiceInvoice::query()
            ->with(['merchant:id,name,email', 'service:id,code,name'])
            ->when($request->query('status'), fn (Builder $q, $s) => $q->where('status', $s))
            ->when($request->query('merchant_id'), fn (Builder $q, $id) => $q->where('merchant_id', $id))
            ->when($request->query('search'), fn (Builder $q, $s) => $q->where('invoice_number', 'like', "%{$s}%"))
            ->latest('id')
            ->paginate(min(100, max(1, (int) $request->query('per_page', 20))));

        return $this->paginatedResponse(
            ServiceInvoiceResource::collection($invoices),
            'Service invoices retrieved successfully'
        );
    }

    public function show(ServiceInvoice $serviceInvoice)
    {
        return $this->successResponse(
            new ServiceInvoiceResource($serviceInvoice->load(['merchant:id,name,email', 'service:id,code,name', 'subscription'])),
            'Service invoice retrieved successfully'
        );
    }

    public function confirm(Request $request, ServiceInvoice $serviceInvoice, ConfirmServiceInvoiceAction $action)
    {
        $validated = $request->validate(['notes' => ['nullable', 'string', 'max:255']]);

        $dto = ConfirmServiceInvoiceDTO::fromValidated($validated, $serviceInvoice->id, $request->user()->id);

        try {
            $confirmed = $action->execute($dto);
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(
            new ServiceInvoiceResource($confirmed->load(['merchant:id,name,email', 'service:id,code,name', 'subscription'])),
            'Invoice dikonfirmasi, langganan aktif'
        );
    }

    public function reject(RejectServiceInvoiceRequest $request, ServiceInvoice $serviceInvoice, RejectServiceInvoiceAction $action)
    {
        try {
            $rejected = $action->execute($serviceInvoice, $request->user(), $request->validated()['reason'] ?? null);
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(
            new ServiceInvoiceResource($rejected->load(['merchant:id,name,email', 'service:id,code,name'])),
            'Invoice ditolak'
        );
    }
}
