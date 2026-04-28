<?php

namespace App\Actions\Category;

use App\Models\Category;
use App\DTOs\Category\UpdateCategoryDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class UpdateCategoryAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Category $category, UpdateCategoryDTO $dto): Category
    {
        $category->update([
            'type_id' => $dto->typeId,
            'name' => $dto->name,
            'code' => $dto->code,
            'validasi_nickname' => $dto->validasiNickname,
            'region' => $dto->region,
            'logo' => $dto->logo,
            'description' => $dto->description,
            'status' => $dto->status,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Updated Category: {$category->name}"
        ));

        return $category->fresh();
    }
}
