<?php

namespace App\Actions\Category\ServerCategoryOption;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\ServerCategoryOption;
use Illuminate\Support\Facades\Auth;

class DeleteServerCategoryOptionAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(ServerCategoryOption $option): bool
    {
        $name = $option->name;
        $deleted = $option->delete();

        if ($deleted) {
            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Deleted Server Category Option: {$name}"
            ));
        }

        return $deleted;
    }
}
