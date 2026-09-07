<?php

namespace App\Actions\PointHistory;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\PointHistory\CreatePointHistoryDTO;
use App\Models\PointHistory;
use Illuminate\Support\Facades\Auth;

class CreatePointHistoryAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(CreatePointHistoryDTO $dto): PointHistory
    {
        $pointHistory = PointHistory::create([
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
            message: "Created Point History for User ID: {$dto->userId}"
        ));

        return $pointHistory;
    }
}
