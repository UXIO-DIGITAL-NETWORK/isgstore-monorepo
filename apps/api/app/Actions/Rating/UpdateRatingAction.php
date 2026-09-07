<?php

namespace App\Actions\Rating;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Rating\UpdateRatingDTO;
use App\Models\Rating;
use Illuminate\Support\Facades\Auth;

class UpdateRatingAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Rating $ratingRecord, UpdateRatingDTO $dto): Rating
    {
        // PUT semantics: the request carries the whole record, so an omitted
        // comment clears it rather than silently keeping the old text.
        $ratingRecord->update([
            'transaction_id' => $dto->transactionId,
            'user_id' => $dto->userId,
            'rating' => $dto->rating,
            'comment' => $dto->comment,
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
