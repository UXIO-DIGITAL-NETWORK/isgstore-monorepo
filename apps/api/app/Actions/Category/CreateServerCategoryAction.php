<?php

namespace App\Actions\Category;

use App\Models\ServerCategory;
use App\DTOs\Category\CreateServerCategoryDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class CreateServerCategoryAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(CreateServerCategoryDTO $dto): ServerCategory
    {
        $serverCategory = ServerCategory::create([
            'category_id' => $dto->categoryId,
            'name' => $dto->name,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Created new Server Category: {$serverCategory->name}"
        ));

        return $serverCategory;
    }
}
