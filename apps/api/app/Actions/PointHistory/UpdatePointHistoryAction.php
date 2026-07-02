<?php

namespace App\Actions\PointHistory;

use App\Models\PointHistory;
use App\DTOs\PointHistory\UpdatePointHistoryDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class UpdatePointHistoryAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(PointHistory $pointHistory, UpdatePointHistoryDTO $dto): PointHistory
    {
        $pointHistory->update([
            'user_id' => $dto->userId,
            'transaction_id' => $dto->transactionId,
            'points_before' => $dto->pointsBefore,
            'points_added' => $dto->pointsAdded,
            'points_after' => $dto->pointsAfter,
            'description' => $dto->description,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Updated Point History ID: {$pointHistory->id}"
        ));

        return $pointHistory->fresh();
    }
}
