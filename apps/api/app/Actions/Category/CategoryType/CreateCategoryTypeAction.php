<?php

namespace App\Actions\Category\CategoryType;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Category\CategoryType\CreateCategoryTypeDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\CategoryType;
use Illuminate\Support\Facades\Auth;

class CreateCategoryTypeAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(CreateCategoryTypeDTO $dto): CategoryType
    {
        $categoryType = CategoryType::create([
            'name' => $dto->name,
            'status' => $dto->status,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Created new Category Type: {$categoryType->name}"
        ));

        return $categoryType;
    }
}
