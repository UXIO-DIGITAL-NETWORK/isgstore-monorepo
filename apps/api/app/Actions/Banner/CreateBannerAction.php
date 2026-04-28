<?php

namespace App\Actions\Banner;

use App\Models\Banner;
use App\DTOs\Banner\CreateBannerDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class CreateBannerAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(CreateBannerDTO $dto): Banner
    {
        $banner = Banner::create([
            'category_id' => $dto->categoryId,
            'name'        => $dto->name,
            'image_path'  => $dto->imagePath,
            'link'        => $dto->link,
        ]);

        $scope = $dto->categoryId ? "Category ID: {$dto->categoryId}" : 'Homepage (Global)';

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Admin created Banner: {$dto->name} [{$scope}]",
        ));

        return $banner;
    }
}
