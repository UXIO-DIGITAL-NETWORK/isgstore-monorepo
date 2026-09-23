<?php

namespace App\Actions\Payment\Monetapay;

use App\Actions\Log\CreateActivityLogAction;
use App\Contracts\PaymentGateway;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

/**
 * 6.6.1 Cancel — cancels a pending Monetapay pay-in order (VA/QRIS/etc.).
 * State-changing, so it records an activity log entry.
 */
class CancelTransactionAction
{
    public function __construct(
        private readonly PaymentGateway $monetapayService,
        private readonly CreateActivityLogAction $activityLogAction
    ) {}

    /**
     * @param  array<string,mixed>  $params  Requires app_id + (order_no | mch_order_no).
     * @return array<string,mixed>
     */
    public function execute(array $params): array
    {
        $response = $this->monetapayService->cancelTransaction($params);

        $reference = $params['order_no'] ?? $params['mch_order_no'] ?? 'unknown';

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Payment gateway cancel requested for order: {$reference}",
        ));

        return $response;
    }
}
