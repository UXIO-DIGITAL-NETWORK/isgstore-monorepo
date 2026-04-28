<?php

namespace App\Actions\Category;

use App\Models\CategoryType;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class DeleteCategoryTypeAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(CategoryType $categoryType): bool
    {
        $name = $categoryType->name;
        $deleted = $categoryType->delete();

        if ($deleted) {
            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Deleted Category Type: {$name}"
            ));
        }

        return $deleted;
    }
}
