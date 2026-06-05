<?php

namespace App\Actions\Transaction;

use App\Models\Transaction;
use App\DTOs\Transaction\UpdateTransactionDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class UpdateTransactionAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Transaction $transaction, UpdateTransactionDTO $dto): Transaction
    {
        return DB::transaction(function () use ($transaction, $dto): Transaction {
            $transaction->update([
                'user_id'            => $dto->userId,
                'payment_channel_id' => $dto->paymentChannelId,
                'supplier_id'        => $dto->supplierId,
                'guest_contact'      => $dto->guestContact,
                'target_uid'         => $dto->targetUid,
                'target_server'      => $dto->targetServer,
                'amount_base'        => $dto->amountBase,
                'amount_fee'         => $dto->amountFee,
                'amount_total'       => $dto->amountTotal,
                'total_price'        => $dto->totalPrice,
                'margin'             => $dto->margin,
                'status'             => $dto->status,
                'is_manual'          => $dto->isManual,
                'sn'                 => $dto->sn,
                'supplier_trx_id'    => $dto->supplierTrxId,
                'supplier_status'    => $dto->supplierStatus,
            ]);

            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Admin updated Transaction: {$transaction->invoice_number} → status: {$dto->status}"
            ));

            return $transaction->fresh();
        });
    }
}
