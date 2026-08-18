<?php

namespace App\Actions\Banner;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Banner\UpdateBannerDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Banner;
use App\Services\ImageOptimizer;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class UpdateBannerAction
{
    public function __construct(
        private CreateActivityLogAction $activityLogAction,
        private ImageOptimizer $images,
    ) {}

    public function execute(Banner $banner, UpdateBannerDTO $dto): Banner
    {
        $imagePath = $banner->image_path;

        if ($dto->imagePath instanceof UploadedFile) {
            if ($imagePath && Storage::disk('public')->exists($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }
            $imagePath = $this->images->store($dto->imagePath, 'banners/images');
        }

        $banner->update([
            'category_id' => $dto->categoryId,
            'name' => $dto->name,
            'image_path' => $imagePath,
            'link' => $dto->link,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Admin updated Banner: {$dto->name}",
        ));

        return $banner->fresh(['category']);
    }
}
