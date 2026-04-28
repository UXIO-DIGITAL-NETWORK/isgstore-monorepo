<?php

namespace App\Actions\Rating;

use App\Models\Rating;
use App\DTOs\Rating\UpdateRatingDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class UpdateRatingAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Rating $ratingRecord, UpdateRatingDTO $dto): Rating
    {
        $ratingRecord->update([
            'order_id' => $dto->orderId,
            'user_id' => $dto->userId,
            'rating' => $dto->rating,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Updated Rating ID: {$ratingRecord->id}"
        ));

        return $ratingRecord->fresh();
    }
}
