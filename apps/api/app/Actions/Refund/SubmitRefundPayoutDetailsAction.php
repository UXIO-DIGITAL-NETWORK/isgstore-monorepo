<?php

declare(strict_types=1);

namespace App\Actions\Refund;

use App\DTOs\Refund\SubmitPayoutDetailsDTO;
use App\Enums\RefundStatus;
use App\Models\RefundRequest;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Writes where the money should be sent — by the customer on the public claim
 * page, or by an admin who took the details over the phone.
 *
 * The destination **freezes** once an admin picks the row up (PROCESSING) or it
 * is terminal. Otherwise someone holding the claim link could swap the account
 * number in the window between an admin reading it and making the transfer,
 * which is a one-step theft with no trail. `payout_submitted_by` records which
 * of the two defences applies if the transfer is ever disputed.
 *
 * Only `manual_transfer` refunds have a destination at all, and no new ones are
 * opened — this action exists to finish the rows that were. A `balance_claim`
 * refund is paid to an account, and also sits in PENDING once claimed, so a
 * status-only guard here would quietly re-open bank transfers on the very
 * scheme that retired them. `isPayoutEditable()` asks method and status as one
 * question, which is why the guard below goes through the model.
 */
class SubmitRefundPayoutDetailsAction
{
    public function execute(RefundRequest $refund, SubmitPayoutDetailsDTO $dto, string $submittedBy): RefundRequest
    {
        return DB::transaction(function () use ($refund, $dto, $submittedBy) {
            /** @var RefundRequest $locked */
            $locked = RefundRequest::whereKey($refund->getKey())->lockForUpdate()->firstOrFail();

            if (! $locked->requiresPayoutDetails()) {
                throw new RuntimeException('Refund ini dikembalikan sebagai saldo, bukan transfer bank.');
            }

            if (! $locked->isPayoutEditable()) {
                throw new RuntimeException('Rekening tujuan tidak dapat diubah lagi untuk refund ini.');
            }

            $locked->update([
                'bank_code' => $dto->bankCode,
                'account_number' => $dto->accountNumber,
                'account_name' => $dto->accountName,
                'account_phone' => $dto->accountPhone,
                'payout_submitted_at' => now(),
                'payout_submitted_by' => $submittedBy,
                // Details in hand — it is now an admin's turn.
                'status' => RefundStatus::PENDING,
            ]);

            return $locked->fresh();
        });
    }
}
