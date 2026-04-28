<?php

namespace App\Actions\Payment;

use App\Models\Payment;
use App\Models\Order;
use App\DTOs\Payment\CreatePaymentDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

class CreatePaymentAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(CreatePaymentDTO $dto): Payment
    {
        $order = Order::findOrFail($dto->orderId);
        
        // Auto-generate reference ID based on order invoice
        // Count existing payments for this order to append a retry count
        $retryCount = Payment::where('order_id', $order->id)->count() + 1;
        $referenceId = 'PAY-' . $order->invoice_number . '-' . str_pad($retryCount, 2, '0', STR_PAD_LEFT);

        $payment = Payment::create([
            'order_id' => $dto->orderId,
            'payment_method_id' => $dto->paymentMethodId,
            'reference_id' => $referenceId,
            'pg_transaction_id' => $dto->pgTransactionId,
            'gross_amount' => $dto->grossAmount,
            'admin_fee' => $dto->adminFee,
            'payment_data' => $dto->paymentData,
            'status' => $dto->status,
            'paid_at' => $dto->paidAt,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Created Payment: {$referenceId} for Order: {$order->invoice_number}"
        ));

        return $payment;
    }
}
