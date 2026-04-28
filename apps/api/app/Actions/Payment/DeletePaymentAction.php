<?php

namespace App\Actions\Payment;

use App\Models\Payment;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class DeletePaymentAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Payment $payment): bool
    {
        $referenceId = $payment->reference_id;
        $deleted = $payment->delete();

        if ($deleted) {
            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Deleted Payment: {$referenceId}"
            ));
        }

        return $deleted;
    }
}
