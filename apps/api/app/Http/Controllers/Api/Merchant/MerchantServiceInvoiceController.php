<?php

namespace App\Http\Controllers\Api\Merchant;

use App\Actions\Service\OpenServiceInvoicePaymentAction;
use App\Actions\Service\SubscribeToServiceAction;
use App\DTOs\Service\SubscribeToServiceDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Service\PayServiceInvoiceBatchRequest;
use App\Http\Requests\Service\PayServiceInvoiceRequest;
use App\Http\Requests\Service\SubscribeServiceRequest;
use App\Http\Resources\Api\Payment\PaymentChannelResource;
use App\Http\Resources\Api\Service\ServiceInvoiceResource;
use App\Jobs\PushServiceOrderToHubJob;
use App\Models\PaymentChannel;
use App\Models\ServiceInvoice;
use App\Models\ServiceInvoicePayment;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * The client's own service bills: request a subscription, pay it through
 * Monetapay, see the history.
 *
 * The `payment-admin` middleware proves *a* client is calling, not *which* —
 * every route-model-bound method re-checks ownership itself.
 */
class MerchantServiceInvoiceController extends Controller
{
    use ApiResponse;

    /** Everything the invoice payload needs: service, payment, subscription. */
    private const DETAIL_RELATIONS = [
        'service:id,code,name',
        'latestPayment.paymentChannel',
        // The pivot rows, so the resource can render THIS bill's share of a
        // batch rather than the batch's own totals.
        'latestPayment.items',
        'subscription',
    ];

    /**
     * The methods a client may settle a service bill with.
     *
     * `balance` is excluded deliberately: the merchant's settlement balance is
     * money kita owes the merchant, not a way for it to pay kita back — that
     * would move value between two ledgers nothing here reconciles.
     */
    public function paymentChannels()
    {
        $channels = PaymentChannel::query()
            ->where('is_active', true)
            ->whereIn('payment_type', PaymentChannel::ALLOWED_STOREFRONT_PAYMENT_TYPES)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return $this->successResponse(
            PaymentChannelResource::collection($channels),
            'Payment channels retrieved successfully'
        );
    }

    public function index(Request $request)
    {
        $invoices = ServiceInvoice::query()
            ->where('merchant_id', $request->user()->id)
            ->with(['service:id,code,name', 'latestPayment.paymentChannel', 'latestPayment.items'])
            ->when($request->query('status'), fn (Builder $q, $s) => $q->where('status', $s))
            ->latest('id')
            ->paginate(min(100, max(1, (int) $request->query('per_page', 20))));

        return $this->paginatedResponse(
            ServiceInvoiceResource::collection($invoices),
            'Service invoices retrieved successfully'
        );
    }

    public function store(
        SubscribeServiceRequest $request,
        SubscribeToServiceAction $action,
        OpenServiceInvoicePaymentAction $openPayment,
    ) {
        $dto = SubscribeToServiceDTO::fromValidated($request->validated(), $request->user()->id);

        try {
            $invoice = $action->execute($dto);
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        try {
            $openPayment->execute($invoice, $dto->paymentChannelId);
        } catch (RuntimeException $e) {
            // A bill nobody can pay is worse than no bill: it would trip the
            // "one open invoice per service" guard and lock the client out of
            // subscribing at all. Drop it so they can simply try again.
            $invoice->delete();

            return $this->errorResponse($e->getMessage(), 422);
        }

        // Tell the Hub a service order was placed (still UNPAID). Fire-and-forget
        // and gated to a Hub-enabled deployment; never fails the purchase.
        PushServiceOrderToHubJob::maybeDispatch($invoice);

        return $this->successResponse(
            new ServiceInvoiceResource($invoice->load(self::DETAIL_RELATIONS)),
            'Invoice langganan berhasil dibuat',
            201
        );
    }

    public function show(Request $request, ServiceInvoice $serviceInvoice)
    {
        $this->assertOwned($request, $serviceInvoice);

        return $this->successResponse(
            new ServiceInvoiceResource($serviceInvoice->load(self::DETAIL_RELATIONS)),
            'Service invoice retrieved successfully'
        );
    }

    /**
     * Re-open payment on an existing unpaid bill.
     *
     * Needed because a bill outlives its payment: a virtual account expires in
     * 600 seconds while the invoice is due in three days. Also how a client
     * switches from, say, a VA to QRIS.
     */
    public function pay(
        PayServiceInvoiceRequest $request,
        ServiceInvoice $serviceInvoice,
        OpenServiceInvoicePaymentAction $action,
    ) {
        $this->assertOwned($request, $serviceInvoice);

        try {
            $action->execute($serviceInvoice, (int) $request->validated()['payment_channel_id']);
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(
            new ServiceInvoiceResource($serviceInvoice->fresh(self::DETAIL_RELATIONS)),
            'Pembayaran dibuka'
        );
    }

    /**
     * 404 rather than 403: another client's invoice must be indistinguishable
     * from one that does not exist, so ids cannot be probed.
     */
    /**
     * Settle several bills in ONE Monetapay attempt.
     *
     * The bills stay one-per-service — that is what keeps each period's own term
     * honest — and the payment is the thing that spans them. The channel fee is
     * charged once on the sum, not once per bill.
     */
    public function payBatch(PayServiceInvoiceBatchRequest $request, OpenServiceInvoicePaymentAction $action)
    {
        // Scoped to the caller BEFORE anything else: an id that belongs to
        // another client must be indistinguishable from one that does not exist.
        $invoices = ServiceInvoice::query()
            ->where('merchant_id', $request->user()->id)
            ->whereIn('id', $request->validated()['invoice_ids'])
            ->get();

        if ($invoices->count() !== count($request->validated()['invoice_ids'])) {
            return $this->errorResponse('Sebagian tagihan tidak ditemukan.', 404);
        }

        try {
            $attempt = $action->executeBatch($invoices, (int) $request->validated()['payment_channel_id']);
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(
            $this->presentAttempt($attempt->load(['paymentChannel', 'invoices'])),
            'Pembayaran dibuka',
            201,
        );
    }

    /**
     * One payment attempt and every bill it covers.
     *
     * Its own endpoint rather than an invoice's detail page: a batch's QR does
     * not belong on any single bill's page, which is the same misattribution the
     * schema was changed to avoid, only in the UI.
     */
    public function showPayment(Request $request, string $reference)
    {
        $attempt = ServiceInvoicePayment::with(['paymentChannel', 'invoices'])
            ->where('reference_id', $reference)
            ->firstOrFail();

        $ownsAll = $attempt->invoices->every(
            fn (ServiceInvoice $invoice) => $invoice->merchant_id === $request->user()->id
        );

        abort_if(! $ownsAll || $attempt->invoices->isEmpty(), 404);

        return $this->successResponse($this->presentAttempt($attempt), 'Pembayaran');
    }

    /** @return array<string, mixed> */
    private function presentAttempt(ServiceInvoicePayment $attempt): array
    {
        return [
            'reference_id' => $attempt->reference_id,
            'channel' => $attempt->paymentChannel?->name,
            'channel_code' => $attempt->paymentChannel?->channel_code,
            'type' => $attempt->paymentChannel?->payment_type,
            'amount' => (int) $attempt->amount,
            'admin_fee' => (int) $attempt->admin_fee,
            'total' => (int) $attempt->total,
            'invoice_count' => (int) $attempt->invoice_count,
            'status' => $attempt->status,
            'expires_at' => $attempt->expiresAt()?->toIso8601String(),
            'is_expired' => $attempt->status === 'PENDING' && $attempt->isExpired(),
            'instructions' => $attempt->payment_data ?: null,
            'invoices' => $attempt->invoices->map(fn (ServiceInvoice $invoice) => [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'service_name' => $invoice->service_name,
                'status' => $invoice->status?->value,
                // This bill's own share of the batch — never the batch total.
                'amount' => (int) $invoice->pivot->amount,
                'admin_fee' => (int) $invoice->pivot->admin_fee,
            ])->values(),
        ];
    }

    private function assertOwned(Request $request, ServiceInvoice $invoice): void
    {
        abort_unless($invoice->merchant_id === $request->user()->id, 404);
    }
}
