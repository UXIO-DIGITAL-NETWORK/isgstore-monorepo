<?php

namespace App\Actions\Banner;

use App\Models\Banner;
use App\DTOs\Banner\UpdateBannerDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class UpdateBannerAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Banner $banner, UpdateBannerDTO $dto): Banner
    {
        $banner->update([
            'category_id' => $dto->categoryId,
            'name'        => $dto->name,
            'image_path'  => $dto->imagePath,
            'link'        => $dto->link,
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
