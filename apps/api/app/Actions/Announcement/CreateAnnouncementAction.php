<?php

namespace App\Actions\Announcement;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Announcement\CreateAnnouncementDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Announcement;
use App\Services\ImageOptimizer;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;

class CreateAnnouncementAction
{
    public function __construct(
        private CreateActivityLogAction $activityLogAction,
        private ImageOptimizer $images,
    ) {}

    public function execute(CreateAnnouncementDTO $dto): Announcement
    {
        $imagePath = $dto->imagePath;

        if ($dto->imagePath instanceof UploadedFile) {
            $imagePath = $this->images->store($dto->imagePath, 'announcements/images');
        }

        $announcement = Announcement::create([
            'category_id' => $dto->categoryId,
            'content' => $dto->content,
            'image_path' => $imagePath,
            'is_active' => $dto->isActive,
        ]);

        $scope = $dto->categoryId ? "Category ID: {$dto->categoryId}" : 'Global';

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Admin created Announcement [{$scope}]: ".substr($dto->content, 0, 50),
        ));

        return $announcement;
    }
}
