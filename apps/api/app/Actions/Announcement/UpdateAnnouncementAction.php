<?php

namespace App\Actions\Announcement;

use App\Models\Announcement;
use App\DTOs\Announcement\UpdateAnnouncementDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class UpdateAnnouncementAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Announcement $announcement, UpdateAnnouncementDTO $dto): Announcement
    {
        $announcement->update([
            'category_id' => $dto->categoryId,
            'content'     => $dto->content,
            'image_path'  => $dto->imagePath,
            'is_active'   => $dto->isActive,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Admin updated Announcement ID: {$announcement->id}",
        ));

        return $announcement->fresh(['category']);
    }
}
