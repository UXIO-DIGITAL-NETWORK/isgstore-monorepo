<?php

namespace App\Actions\Category\ServerCategory;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Category\ServerCategory\UpdateServerCategoryDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\ServerCategory;
use Illuminate\Support\Facades\Auth;

class UpdateServerCategoryAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(ServerCategory $serverCategory, UpdateServerCategoryDTO $dto): ServerCategory
    {
        $serverCategory->update([
            'category_id' => $dto->categoryId,
            'name' => $dto->name,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Updated Server Category: {$serverCategory->name}"
        ));

        return $serverCategory->fresh();
    }
}
