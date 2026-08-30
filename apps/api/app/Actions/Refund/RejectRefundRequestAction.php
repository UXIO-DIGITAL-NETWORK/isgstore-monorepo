<?php

declare(strict_types=1);

namespace App\Actions\Refund;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Enums\RefundStatus;
use App\Models\RefundRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Refuses a refund with a reason — a duplicate claim, a chargeback already
 * raised elsewhere, an order that turned out to be fulfilled after all.
 *
 * No money moves, and the merchant settlement is deliberately left intact: the
 * sale still stands. `RefundEligibility` treats a REJECTED refund as absent, so
 * a genuine refund can still be opened for the same transaction afterwards.
 */
class RejectRefundRequestAction
{
    public function __construct(private readonly CreateActivityLogAction $activityLogAction) {}

    public function execute(RefundRequest $refund, User $admin, string $reason): RefundRequest
    {
        $fresh = DB::transaction(function () use ($refund, $admin, $reason) {
            /** @var RefundRequest $locked */
            $locked = RefundRequest::whereKey($refund->getKey())->lockForUpdate()->firstOrFail();

            if ($locked->status->isTerminal()) {
                throw new RuntimeException('Refund ini sudah diselesaikan atau ditolak.');
            }

            $locked->update([
                'status' => RefundStatus::REJECTED,
                'reject_reason' => $reason,
                'processed_by' => $admin->id,
                'processed_at' => now(),
                // The claim link must stop working the moment the refund is
                // refused, or the customer keeps filling in a dead form.
                'claim_token_hash' => null,
                'claim_expires_at' => null,
            ]);

            return $locked->fresh();
        });

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: $admin->id,
            ipAddress: request()->ip() ?? '127.0.0.1',
            userAgent: request()->userAgent(),
            message: "Admin menolak refund {$fresh->refund_number} — Alasan: {$reason}",
            transactionId: $fresh->transaction_id,
        ));

        return $fresh;
    }
}
