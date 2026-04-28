<?php

namespace App\Actions\Category;

use App\Models\SubCategory;
use App\DTOs\Category\CreateSubCategoryDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class CreateSubCategoryAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(CreateSubCategoryDTO $dto): SubCategory
    {
        $subCategory = SubCategory::create([
            'category_id' => $dto->categoryId,
            'name' => $dto->name,
            'logo' => $dto->logo,
            'status' => $dto->status,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Created new Sub Category: {$subCategory->name}"
        ));

        return $subCategory;
    }
}
