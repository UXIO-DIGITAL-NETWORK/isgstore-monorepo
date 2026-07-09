<?php

namespace App\Actions\Transaction;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Transaction\CreateTransactionDTO;
use App\Models\Transaction;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateTransactionAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(CreateTransactionDTO $dto): Transaction
    {
        return DB::transaction(function () use ($dto): Transaction {
            $invoiceNumber = 'INV-'.date('Ymd').'-'.strtoupper(Str::random(6));

            $transaction = Transaction::create([
                'invoice_number' => $invoiceNumber,
                'user_id' => $dto->userId,
                'payment_channel_id' => $dto->paymentChannelId,
                'supplier_id' => $dto->supplierId,
                'product_id' => $dto->productId,
                'guest_contact' => $dto->guestContact,
                'target_uid' => $dto->targetUid,
                'target_server' => $dto->targetServer,
                'amount_base' => $dto->amountBase,
                'amount_fee' => $dto->amountFee,
                'amount_total' => $dto->amountTotal,
                'total_price' => $dto->totalPrice,
                'margin' => $dto->margin,
                'status' => $dto->status,
                'is_manual' => $dto->isManual,
                'sn' => $dto->sn,
                'supplier_trx_id' => $dto->supplierTrxId,
                'supplier_status' => $dto->supplierStatus,
            ]);

            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Admin created Transaction: {$invoiceNumber}"
            ));

            return $transaction;
        });
    }
}
