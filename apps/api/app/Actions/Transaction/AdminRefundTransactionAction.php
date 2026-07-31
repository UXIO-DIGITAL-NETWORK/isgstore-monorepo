<?php

namespace App\Actions\Transaction;

use App\Actions\Log\CreateActivityLogAction;
use App\Actions\Payment\RefundFailedTransactionAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Transaction;
use Illuminate\Support\Facades\Auth;

/**
 * Admin-triggered wrapper around RefundFailedTransactionAction — the
 * underlying action is idempotent/context-free (safe from a webhook or a
 * queue job too), this just adds the admin audit trail with an optional reason.
 */
class AdminRefundTransactionAction
{
    public function __construct(
        private RefundFailedTransactionAction $refundAction,
        private CreateActivityLogAction $activityLogAction
    ) {}

    public function execute(Transaction $transaction, ?string $reason): Transaction
    {
        $this->refundAction->execute($transaction);

        $message = "Admin refunded Transaction: {$transaction->invoice_number}";
        if ($reason) {
            $message .= " — Reason: {$reason}";
        }

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: $message,
            transactionId: $transaction->id
        ));

        return $transaction->fresh(['payment']);
    }
}
