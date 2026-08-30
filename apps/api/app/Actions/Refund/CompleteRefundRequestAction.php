<?php

declare(strict_types=1);

namespace App\Actions\Refund;

use App\Actions\Log\CreateActivityLogAction;
use App\Actions\Settlement\ReverseMerchantSettlementAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Refund\CompleteRefundDTO;
use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Enums\TransactionStatus;
use App\Models\RefundRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * The admin confirms the bank transfer is done. This is the moment a guest
 * refund's money actually leaves, so it is where everything downstream of
 * "cash out" happens at once:
 *
 *   - `payments.status` → REFUNDED (the finance reports read that column as
 *     cash out; flipping it at request time would report money that is still
 *     in the account);
 *   - `transactions.status` → REFUNDED;
 *   - the merchant settlement is un-booked;
 *   - the customer is told.
 *
 * Only the admin holding the row may complete it — the guard that stops the
 * second admin's transfer.
 */
class CompleteRefundRequestAction
{
    public function __construct(
        private readonly ReverseMerchantSettlementAction $reverseSettlement,
        private readonly SendRefundCompletedNotificationAction $notification,
        private readonly CreateActivityLogAction $activityLogAction,
    ) {}

    public function execute(RefundRequest $refund, User $admin, CompleteRefundDTO $dto): RefundRequest
    {
        $fresh = DB::transaction(function () use ($refund, $admin, $dto) {
            /** @var RefundRequest $locked */
            $locked = RefundRequest::with(['transaction.payment'])
                ->whereKey($refund->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            if (! in_array($locked->status, [RefundStatus::PENDING, RefundStatus::PROCESSING], true)) {
                throw new RuntimeException('Refund ini sudah diselesaikan atau ditolak.');
            }

            // Someone else opened their banking app for this row. Make them
            // talk to each other rather than both press send.
            if ($locked->processed_by !== null && $locked->processed_by !== $admin->id) {
                throw new RuntimeException('Refund ini sedang diproses oleh admin lain.');
            }

            if (! $locked->hasPayoutDetails()) {
                throw new RuntimeException('Rekening tujuan belum diisi.');
            }

            $locked->update([
                'status' => RefundStatus::COMPLETED,
                'processed_by' => $admin->id,
                'processed_at' => $locked->processed_at ?? now(),
                'proof_path' => $dto->proofPath ?? $locked->proof_path,
                'admin_note' => $dto->note ?? $locked->admin_note,
                'refunded_at' => now(),
            ]);

            // The money is out: the payment is no longer collected revenue and
            // the order is terminally refunded.
            $locked->transaction?->payment?->update(['status' => PaymentStatus::REFUNDED]);
            $locked->transaction?->update(['status' => TransactionStatus::REFUNDED]);

            return $locked->fresh(['transaction.payment']);
        });

        // ── Post-commit: bookkeeping and notifications, neither of which may
        // undo a transfer that has already happened in the real world. ──
        $this->reverseSettlement->execute($fresh);
        $this->notification->execute($fresh);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: $admin->id,
            ipAddress: request()->ip() ?? '127.0.0.1',
            userAgent: request()->userAgent(),
            message: "Admin menyelesaikan refund {$fresh->refund_number} sebesar Rp ".number_format((int) $fresh->amount),
            transactionId: $fresh->transaction_id,
        ));

        return $fresh;
    }
}
