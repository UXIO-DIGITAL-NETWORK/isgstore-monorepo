<?php

namespace App\Actions\Transaction;

use App\Actions\Digiflazz\ProcessDigiflazzTransactionAction;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Transaction;
use Illuminate\Support\Facades\Auth;

/**
 * "Retry Invoice" — re-dispatches a fresh Digiflazz fulfilment request for a
 * failed transaction, distinguished in the audit log from an automatic
 * (queue-driven) retry.
 */
class AdminRetryTransactionAction
{
    public function __construct(
        private ProcessDigiflazzTransactionAction $processAction,
        private CreateActivityLogAction $activityLogAction
    ) {}

    public function execute(Transaction $transaction): Transaction
    {
        $updated = $this->processAction->execute($transaction);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Admin retried Transaction: {$transaction->invoice_number}"
        ));

        return $updated->fresh();
    }
}
