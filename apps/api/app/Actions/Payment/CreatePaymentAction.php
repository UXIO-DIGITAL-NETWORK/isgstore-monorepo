<?php

namespace App\Actions\Payment;

use App\Models\Payment;
use App\Models\Transaction;
use App\DTOs\Payment\CreatePaymentDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class CreatePaymentAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(CreatePaymentDTO $dto): Payment
    {
        $transaction = Transaction::findOrFail($dto->transactionId);

        $retryCount = Payment::where('transaction_id', $transaction->id)->count() + 1;
        $referenceId = 'PAY-' . $transaction->invoice_number . '-' . str_pad($retryCount, 2, '0', STR_PAD_LEFT);

        $payment = Payment::create([
            'transaction_id' => $dto->transactionId,
            'payment_channel_id' => $dto->paymentChannelId,
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
            message: "Created Payment: {$referenceId} for Transaction: {$transaction->invoice_number}"
        ));

        return $payment;
    }
}
