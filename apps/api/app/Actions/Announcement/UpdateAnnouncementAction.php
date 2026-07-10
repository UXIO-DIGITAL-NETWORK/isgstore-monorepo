<?php

namespace App\Actions\Announcement;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Announcement\UpdateAnnouncementDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Announcement;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class UpdateAnnouncementAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Announcement $announcement, UpdateAnnouncementDTO $dto): Announcement
    {
        $imagePath = $announcement->image_path;

        if ($dto->imagePath instanceof UploadedFile) {
            if ($imagePath && Storage::disk('public')->exists($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }
            $imagePath = $dto->imagePath->store('announcements/images', 'public');
        }

        $announcement->update([
            'category_id' => $dto->categoryId,
            'content' => $dto->content,
            'image_path' => $imagePath,
            'is_active' => $dto->isActive,
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
