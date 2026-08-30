<?php

namespace App\Actions\Transaction;

use App\Actions\Log\CreateActivityLogAction;
use App\Actions\Refund\InitiateRefundAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\RefundRequest;
use App\Models\Transaction;
use App\Support\Refund\RefundEligibility;
use Illuminate\Support\Facades\Auth;
use RuntimeException;

/**
 * Admin-triggered wrapper around InitiateRefundAction — the underlying action
 * is idempotent and context-free (safe from a webhook or a queue job too);
 * this adds the admin audit trail with an optional reason.
 *
 * Unlike the automatic callers, this one **refuses loudly**. The action no-ops
 * on an unpaid or already-refunded transaction, which is right for a webhook
 * and wrong for a human: an admin told "refunded successfully" for a refund
 * that never happened would sit waiting for a queue row that will never appear.
 * The controller maps the exception to a 422.
 */
class AdminRefundTransactionAction
{
    public function __construct(
        private InitiateRefundAction $refundAction,
        private CreateActivityLogAction $activityLogAction
    ) {}

    public function execute(Transaction $transaction, ?string $reason): RefundRequest
    {
        if ($why = RefundEligibility::reason($transaction)) {
            throw new RuntimeException($why);
        }

        $refund = $this->refundAction->execute($transaction);

        // Eligibility passed a moment ago, so a null here means a concurrent
        // caller got there first — the refund exists, it just isn't ours.
        if ($refund === null) {
            throw new RuntimeException('Refund untuk transaksi ini sudah dibuat oleh proses lain.');
        }

        $message = "Admin refunded Transaction: {$transaction->invoice_number} ({$refund->refund_number})";
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

        return $refund;
    }
}
