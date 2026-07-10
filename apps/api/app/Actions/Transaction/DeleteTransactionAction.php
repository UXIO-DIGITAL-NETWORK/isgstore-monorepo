<?php

namespace App\Actions\Transaction;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Transaction;
use Illuminate\Support\Facades\Auth;

class DeleteTransactionAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Transaction $transaction): bool
    {
        $invoiceNumber = $transaction->invoice_number;
        $deleted = $transaction->delete();

        if ($deleted) {
            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Admin deleted Transaction: {$invoiceNumber}"
            ));
        }

        return $deleted;
    }
}
