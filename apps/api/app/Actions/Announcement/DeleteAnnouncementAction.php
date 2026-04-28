<?php

namespace App\Actions\Announcement;

use App\Models\Announcement;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class DeleteAnnouncementAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Announcement $announcement): bool
    {
        $id = $announcement->id;
        $deleted = $announcement->delete();

        if ($deleted) {
            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Admin deleted Announcement ID: {$id}",
            ));
        }

        return $deleted;
    }
}
