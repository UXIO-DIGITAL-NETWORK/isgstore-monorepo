<?php

namespace App\Actions\Log;

use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\ActivityLog;

/**
 * Explicit action for capturing activity logs.
 * This class is designed to be injected into other business actions
 * (e.g., UpdateProductAction, ProcessPaymentAction) to log rich contextual messages
 * without relying on Eloquent Observers.
 */
class CreateActivityLogAction
{
    public function execute(CreateActivityLogDTO $dto): ActivityLog
    {
        return ActivityLog::create([
            'user_id' => $dto->userId,
            'ip_address' => $dto->ipAddress,
            'user_agent' => $dto->userAgent,
            'message' => $dto->message,
            'type' => $dto->type?->value,
        ]);
    }
}
