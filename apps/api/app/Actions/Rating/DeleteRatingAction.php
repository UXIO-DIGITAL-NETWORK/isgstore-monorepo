<?php

namespace App\Actions\Rating;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Rating;
use Illuminate\Support\Facades\Auth;

class DeleteRatingAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Rating $rating): bool
    {
        $id = $rating->id;
        $deleted = $rating->delete();

        if ($deleted) {
            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Deleted Rating ID: {$id}"
            ));
        }

        return $deleted;
    }
}
