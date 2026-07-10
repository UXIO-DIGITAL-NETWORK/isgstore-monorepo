<?php

namespace App\Actions\PointHistory;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\PointHistory;
use Illuminate\Support\Facades\Auth;

class DeletePointHistoryAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(PointHistory $pointHistory): bool
    {
        $id = $pointHistory->id;
        $deleted = $pointHistory->delete();

        if ($deleted) {
            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Deleted Point History ID: {$id}"
            ));
        }

        return $deleted;
    }
}
