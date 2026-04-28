<?php

namespace App\Actions\Category;

use App\Models\ServerCategoryOption;
use App\DTOs\Category\UpdateServerCategoryOptionDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class UpdateServerCategoryOptionAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(ServerCategoryOption $option, UpdateServerCategoryOptionDTO $dto): ServerCategoryOption
    {
        $option->update([
            'server_category_id' => $dto->serverCategoryId,
            'name' => $dto->name,
            'value' => $dto->value,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Updated Server Category Option: {$option->name}"
        ));

        return $option->fresh();
    }
}
