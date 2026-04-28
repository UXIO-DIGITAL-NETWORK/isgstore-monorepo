<?php

namespace App\Actions\Announcement;

use App\Models\Announcement;
use App\DTOs\Announcement\CreateAnnouncementDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class CreateAnnouncementAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(CreateAnnouncementDTO $dto): Announcement
    {
        $announcement = Announcement::create([
            'category_id' => $dto->categoryId,
            'content'     => $dto->content,
            'image_path'  => $dto->imagePath,
            'is_active'   => $dto->isActive,
        ]);

        $scope = $dto->categoryId ? "Category ID: {$dto->categoryId}" : 'Global';

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Admin created Announcement [{$scope}]: " . substr($dto->content, 0, 50),
        ));

        return $announcement;
    }
}
