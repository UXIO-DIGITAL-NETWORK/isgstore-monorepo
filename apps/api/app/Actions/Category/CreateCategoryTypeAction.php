<?php

namespace App\Actions\Category;

use App\Models\CategoryType;
use App\DTOs\Category\CreateCategoryTypeDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
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
