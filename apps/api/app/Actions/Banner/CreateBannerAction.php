<?php

namespace App\Actions\Banner;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Banner\CreateBannerDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Banner;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;

class CreateBannerAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(CreateBannerDTO $dto): Banner
    {
        $imagePath = $dto->imagePath;

        if ($dto->imagePath instanceof UploadedFile) {
            $imagePath = $dto->imagePath->store('banners/images', 'public');
        }

        $banner = Banner::create([
            'category_id' => $dto->categoryId,
            'name' => $dto->name,
            'image_path' => $imagePath,
            'link' => $dto->link,
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
