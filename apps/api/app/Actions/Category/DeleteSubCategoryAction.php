<?php

namespace App\Actions\Category;

use App\Models\SubCategory;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class DeleteSubCategoryAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(SubCategory $subCategory): bool
    {
        $name = $subCategory->name;
        $deleted = $subCategory->delete();

        if ($deleted) {
            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Deleted Sub Category: {$name}"
            ));
        }

        return $deleted;
    }
}
