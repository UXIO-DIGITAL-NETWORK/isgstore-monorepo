<?php

namespace App\Http\Controllers\Api\Merchant;

use App\Actions\Service\SubmitServiceProofAction;
use App\Actions\Service\SubscribeToServiceAction;
use App\DTOs\Service\SubscribeToServiceDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Service\SubscribeServiceRequest;
use App\Http\Requests\Service\UploadServiceProofRequest;
use App\Http\Resources\Api\Service\ServiceInvoiceResource;
use App\Models\ServiceInvoice;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * The client's own service bills: request a subscription, see the history,
 * upload the bukti transfer.
 *
 * The `payment-admin` middleware proves *a* client is calling, not *which* —
 * every route-model-bound method re-checks ownership itself.
 */
class MerchantServiceInvoiceController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $invoices = ServiceInvoice::query()
            ->where('merchant_id', $request->user()->id)
            ->with('service:id,code,name')
            ->when($request->query('status'), fn (Builder $q, $s) => $q->where('status', $s))
            ->latest('id')
            ->paginate(min(100, max(1, (int) $request->query('per_page', 20))));

        return $this->paginatedResponse(
            ServiceInvoiceResource::collection($invoices),
            'Service invoices retrieved successfully'
        );
    }

    public function store(SubscribeServiceRequest $request, SubscribeToServiceAction $action)
    {
        $dto = SubscribeToServiceDTO::fromValidated($request->validated(), $request->user()->id);

        try {
            $invoice = $action->execute($dto);
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(
            new ServiceInvoiceResource($invoice->load('service:id,code,name')),
            'Invoice langganan berhasil dibuat',
            201
        );
    }

    public function show(Request $request, ServiceInvoice $serviceInvoice)
    {
        $this->assertOwned($request, $serviceInvoice);

        return $this->successResponse(
            new ServiceInvoiceResource($serviceInvoice->load(['service:id,code,name', 'subscription'])),
            'Service invoice retrieved successfully'
        );
    }

    public function uploadProof(UploadServiceProofRequest $request, ServiceInvoice $serviceInvoice, SubmitServiceProofAction $action)
    {
        $this->assertOwned($request, $serviceInvoice);

        $proofPath = $request->file('proof')->store('service-invoices/proofs', 'public');

        try {
            $updated = $action->execute($serviceInvoice, $proofPath, $request->validated()['notes'] ?? null);
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(
            new ServiceInvoiceResource($updated->load('service:id,code,name')),
            'Bukti transfer terkirim, menunggu konfirmasi'
        );
    }

    /**
     * 404 rather than 403: another client's invoice must be indistinguishable
     * from one that does not exist, so ids cannot be probed.
     */
    private function assertOwned(Request $request, ServiceInvoice $invoice): void
    {
        abort_unless($invoice->merchant_id === $request->user()->id, 404);
    }
}
