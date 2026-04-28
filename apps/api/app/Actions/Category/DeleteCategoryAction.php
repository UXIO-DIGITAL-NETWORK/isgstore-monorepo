<?php

namespace App\Actions\Category;

use App\Models\Category;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class DeleteCategoryAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Category $category): bool
    {
        $name = $category->name;
        $deleted = $category->delete();

        if ($deleted) {
            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Deleted Category: {$name}"
            ));
        }

        return $deleted;
    }
}
