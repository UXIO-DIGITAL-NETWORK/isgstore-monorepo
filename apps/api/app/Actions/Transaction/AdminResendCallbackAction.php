<?php

namespace App\Actions\Transaction;

use App\Actions\Log\CreateActivityLogAction;
use App\Actions\Uxiolabs\CheckUxiolabsTransactionStatusAction;
use App\Actions\Uxiolabs\SendUxiolabsStatusNotificationAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Enums\TransactionStatus;
use App\Models\Transaction;
use Illuminate\Support\Facades\Auth;
use InvalidArgumentException;

/**
 * "Resend Callback" — re-polls uxiolabs for this transaction's current
 * status and syncs our record, for a transaction stuck mid-flight instead of
 * waiting on their webhook. Only meaningful for a PROCESSING transaction
 * (see CheckUxiolabsTransactionStatusAction).
 */
class AdminResendCallbackAction
{
    public function __construct(
        private CheckUxiolabsTransactionStatusAction $checkStatusAction,
        private CreateActivityLogAction $activityLogAction
    ) {}

    public function execute(Transaction $transaction): Transaction
    {
        if ($transaction->status !== TransactionStatus::PROCESSING) {
            throw new InvalidArgumentException('Only PROCESSING transactions can be re-checked with the supplier.');
        }

        $updated = $this->checkStatusAction->execute(
            $transaction->invoice_number,
            SendUxiolabsStatusNotificationAction::SOURCE_MANUAL,
        );

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Admin resent callback check for Transaction: {$transaction->invoice_number}",
            transactionId: $transaction->id
        ));

        return $updated;
    }
}
