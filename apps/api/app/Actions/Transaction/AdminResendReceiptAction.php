<?php

namespace App\Actions\Transaction;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Transaction;
use Illuminate\Support\Facades\Auth;

/**
 * "Resend Receipt" — re-issues the transaction receipt to the customer and
 * records the action on the order's trail.
 *
 * NOTE: the actual delivery channel (email / WhatsApp) is not wired in this
 * codebase yet, so this currently records the intent and returns success so the
 * admin action is auditable. Hook the real notifier here once it exists.
 */
class AdminResendReceiptAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Transaction $transaction): Transaction
    {
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
