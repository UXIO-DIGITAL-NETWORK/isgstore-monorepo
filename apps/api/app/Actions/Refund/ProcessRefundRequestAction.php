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
 * An admin claims a refund row before making the transfer.
 *
 * This is the whole reason PROCESSING exists: two admins working the same
 * queue would otherwise both see a PENDING row, both open their banking app,
 * and both send the money. Claiming stamps `processed_by`, and
 * CompleteRefundRequestAction refuses a different admin.
 */
class ProcessRefundRequestAction
{
    public function __construct(private readonly CreateActivityLogAction $activityLogAction) {}

    public function execute(RefundRequest $refund, User $admin): RefundRequest
    {
        $fresh = DB::transaction(function () use ($refund, $admin) {
            /** @var RefundRequest $locked */
            $locked = RefundRequest::whereKey($refund->getKey())->lockForUpdate()->firstOrFail();

            if ($locked->status === RefundStatus::PROCESSING && $locked->processed_by === $admin->id) {
                // Re-claiming your own row is a no-op, not an error — a double
                // click must not read as a conflict.
                return $locked;
            }

            if ($locked->status !== RefundStatus::PENDING) {
                throw new RuntimeException('Refund ini tidak sedang menunggu untuk diproses.');
            }

            if (! $locked->hasPayoutDetails()) {
                throw new RuntimeException('Rekening tujuan belum diisi.');
            }

            $locked->update([
                'status' => RefundStatus::PROCESSING,
                'processed_by' => $admin->id,
                'processed_at' => now(),
            ]);

            return $locked->fresh();
        });

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: $admin->id,
            ipAddress: request()->ip() ?? '127.0.0.1',
            userAgent: request()->userAgent(),
            message: "Admin mengambil refund {$fresh->refund_number} untuk diproses",
            transactionId: $fresh->transaction_id,
        ));

        return $fresh;
    }
}
