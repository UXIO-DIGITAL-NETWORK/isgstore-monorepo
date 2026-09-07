<?php

namespace App\Actions\Payment;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Payment\UpdatePaymentDTO;
use App\Models\Payment;
use Illuminate\Support\Facades\Auth;

class UpdatePaymentAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Payment $payment, UpdatePaymentDTO $dto): Payment
    {
        $payment->update([
            'transaction_id' => $dto->transactionId,
            'payment_channel_id' => $dto->paymentChannelId,
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
            message: "Updated Payment: {$payment->reference_id}"
        ));

        return $payment->fresh();
    }
}
