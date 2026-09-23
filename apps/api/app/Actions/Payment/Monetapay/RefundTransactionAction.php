<?php

namespace App\Actions\Payment\Monetapay;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Services\Payment\MonetapayService;
use Illuminate\Support\Facades\Auth;

/**
 * 6.6.2 Refund — issues a (partial or full) refund against a settled pay-in order.
 * State-changing, so it records an activity log entry.
 */
class RefundTransactionAction
{
    public function __construct(
        private readonly MonetapayService $monetapayService,
        private readonly CreateActivityLogAction $activityLogAction
    ) {}

    /**
     * @param  array<string,mixed>  $params  Requires app_id, refund_mch_order_no, payment_order_no, amount.
     * @return array<string,mixed>
     */
    public function execute(array $params): array
    {
        $response = $this->monetapayService->refundTransaction($params);

        $reference = $params['payment_order_no'] ?? $params['refund_mch_order_no'] ?? 'unknown';

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Payment gateway refund requested for payment order: {$reference} (amount: {$params['amount']})",
        ));

        return $response;
    }
}
