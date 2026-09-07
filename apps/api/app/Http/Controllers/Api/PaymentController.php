<?php

namespace App\Http\Controllers\Api;

use App\Actions\Payment\CreatePaymentAction;
use App\Actions\Payment\DeletePaymentAction;
use App\Actions\Payment\GetPaymentsAction;
use App\Actions\Payment\UpdatePaymentAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\StorePaymentRequest;
use App\Http\Requests\Payment\UpdatePaymentRequest;
use App\Http\Resources\Api\Payment\PaymentResource;
use App\Models\Payment;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    use ApiResponse;

    public function index(Request $request, GetPaymentsAction $action)
    {
        $perPage = $request->query('per_page', 15);
        $payments = $action->execute((int) $perPage);

        return $this->paginatedResponse(PaymentResource::collection($payments), 'Payments retrieved successfully');
    }

    public function store(StorePaymentRequest $request, CreatePaymentAction $action)
    {
        $payment = $action->execute($request->toDTO());

        return $this->successResponse(
            new PaymentResource($payment->load(['transaction', 'paymentChannel'])),
            'Payment created successfully',
            201
        );
    }

    public function show(Payment $payment)
    {
        return $this->successResponse(
            new PaymentResource($payment->load(['transaction', 'paymentChannel'])),
            'Payment retrieved successfully'
        );
    }

    public function update(UpdatePaymentRequest $request, Payment $payment, UpdatePaymentAction $action)
    {
        $payment = $action->execute($payment, $request->toDTO());

        return $this->successResponse(
            new PaymentResource($payment->load(['transaction', 'paymentChannel'])),
            'Payment updated successfully'
        );
    }

    public function destroy(Payment $payment, DeletePaymentAction $action)
    {
        $action->execute($payment);

        return $this->successResponse(null, 'Payment deleted successfully');
    }
}
