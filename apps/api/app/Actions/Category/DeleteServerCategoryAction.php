<?php

namespace App\Actions\Category;

use App\Models\ServerCategory;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class DeleteServerCategoryAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(ServerCategory $serverCategory): bool
    {
        $name = $serverCategory->name;
        $deleted = $serverCategory->delete();

        if ($deleted) {
            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Deleted Server Category: {$name}"
            ));
        }

        return $deleted;
    }
}
