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

            // The request resolved the whole identifier set from the product's
            // category, in declaration order — so the first two values are exactly
            // the two mirrored columns, and anything beyond them can only live in
            // `target_values`.
            $values = array_values($dto->orderFields);
            $targetUid = $values[0] ?? $dto->targetUid;
            $targetServer = ($values[1] ?? $dto->targetServer) ?: null;

            $transaction = Transaction::create([
                'invoice_number' => $invoiceNumber,
                'user_id' => $dto->userId,
                'payment_channel_id' => $dto->paymentChannelId,
                'supplier_id' => $dto->supplierId,
                'product_id' => $dto->productId,
                'guest_contact' => $dto->guestContact,
                'target_uid' => $targetUid,
                'target_server' => $targetServer,
                // A game may declare more identifiers than the columns hold, and
                // fulfilment composes the supplier's `target` from this map.
                'target_values' => $dto->orderFields !== [] ? $dto->orderFields : null,
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
