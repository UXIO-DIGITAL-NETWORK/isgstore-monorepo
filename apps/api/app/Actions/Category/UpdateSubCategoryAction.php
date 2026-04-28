<?php

namespace App\Actions\Category;

use App\Models\SubCategory;
use App\DTOs\Category\UpdateSubCategoryDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class UpdateSubCategoryAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(SubCategory $subCategory, UpdateSubCategoryDTO $dto): SubCategory
    {
        $subCategory->update([
            'category_id' => $dto->categoryId,
            'name' => $dto->name,
            'logo' => $dto->logo,
            'status' => $dto->status,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Updated Sub Category: {$subCategory->name}"
        ));

        return $subCategory->fresh();
    }
}
