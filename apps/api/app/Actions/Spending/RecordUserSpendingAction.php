<?php

namespace App\Actions\Spending;

use App\DTOs\Spending\UpdateUserSpendingDTO;
use App\Models\UserSpending;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class RecordUserSpendingAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}
    public function execute(UpdateUserSpendingDTO $dto): void
    {
        $periods = [date('Y-m'), 'ALL_TIME'];

        foreach ($periods as $period) {
            $spending = UserSpending::firstOrCreate(
                [
                    'user_id' => $dto->userId,
                    'period' => $period,
                ],
                [
                    'total_amount' => 0,
                    'total_orders' => 0,
                ]
            );

            $spending->increment('total_amount', $dto->amount);
            $spending->increment('total_orders', 1);
            
            $spending->update([
                'last_order_at' => now(),
            ]);
        }

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id() ?? $dto->userId,
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Recorded user spending of {$dto->amount} for user ID: {$dto->userId}"
        ));
    }
}
