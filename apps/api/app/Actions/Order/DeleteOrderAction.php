<?php

namespace App\Actions\Order;

use App\Models\Order;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class DeleteOrderAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Order $order): bool
    {
        $invoiceNumber = $order->invoice_number;
        $deleted = $order->delete();

        if ($deleted) {
            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Deleted Order: {$invoiceNumber}"
            ));
        }

        return $deleted;
    }
}
