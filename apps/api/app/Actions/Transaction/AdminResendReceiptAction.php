<?php

namespace App\Actions\Transaction;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Transaction;
use Illuminate\Support\Facades\Auth;

/**
 * "Resend Receipt" — re-issues the purchase receipt email to the buyer and
 * records the action on the order's trail. Uses force, so it re-sends even if a
 * receipt was already delivered automatically on completion.
 */
class AdminResendReceiptAction
{
    public function __construct(
        private CreateActivityLogAction $activityLogAction,
        private SendTransactionReceiptAction $sendReceiptAction,
    ) {}

    public function execute(Transaction $transaction): Transaction
    {
        $this->sendReceiptAction->execute($transaction, force: true);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Admin resent the receipt for Transaction: {$transaction->invoice_number}",
            transactionId: $transaction->id,
        ));

        return $transaction;
    }
}
