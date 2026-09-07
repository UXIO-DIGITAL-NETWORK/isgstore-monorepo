<?php

namespace App\Actions\Category;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Category;
use Illuminate\Support\Facades\Auth;

/**
 * Toggles a category's active/inactive standing. Purpose-built so the storefront
 * list's status switch changes only `status` — unlike the full-replace
 * UpdateCategoryAction, which requires (and overwrites) every column.
 */
class SetCategoryStatusAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Category $category, bool $status): Category
    {
        $category->forceFill(['status' => $status])->save();

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: 'Set status of Category '.$category->name.' to '.($status ? 'active' : 'inactive'),
        ));

        return $category->refresh();
    }
}
