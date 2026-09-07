<?php

namespace App\Actions\Transaction;

use App\Actions\Log\CreateActivityLogAction;
use App\Actions\Uxiolabs\ProcessUxiolabsTransactionAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Transaction;
use App\Support\Refund\RefundEligibility;
use Illuminate\Support\Facades\Auth;
use RuntimeException;

/**
 * "Retry Invoice" — re-dispatches a fresh uxiolabs fulfilment request for a
 * failed transaction, distinguished in the audit log from an automatic
 * (queue-driven) retry.
 *
 * If the original order actually reached uxiolabs, the retry hits their
 * duplicate-idtrx guard and the action settles the row back to PROCESSING to
 * await the callback — a retry can never double-order.
 */
class AdminRetryTransactionAction
{
    public function __construct(
        private ProcessUxiolabsTransactionAction $processAction,
        private CreateActivityLogAction $activityLogAction
    ) {}

    public function execute(Transaction $transaction): Transaction
    {
        // The customer has already been paid back (or is about to be). Ordering
        // again would mean they got the item *and* the money. A REJECTED refund
        // doesn't count — no money left, so the order is fair game.
        if (RefundEligibility::hasOpenOrSettledRefund($transaction)) {
            throw new RuntimeException('Transaksi ini sudah direfund — batalkan refund-nya dulu sebelum mengulang pesanan.');
        }

        $updated = $this->processAction->execute($transaction);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Admin retried Transaction: {$transaction->invoice_number}",
            transactionId: $transaction->id
        ));

        return $updated->fresh();
    }
}
