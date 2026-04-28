<?php

namespace App\Actions\Order;

use App\Models\Order;
use App\DTOs\Order\UpdateOrderDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class UpdateOrderAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Order $order, UpdateOrderDTO $dto): Order
    {
        $order->update([
            'user_id' => $dto->userId,
            'product_id' => $dto->productId,
            'supplier_id' => $dto->supplierId,
            'target_uid' => $dto->targetUid,
            'target_server' => $dto->targetServer,
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
            message: "Updated Order: {$order->invoice_number}"
        ));

        return $order->fresh();
    }
}
