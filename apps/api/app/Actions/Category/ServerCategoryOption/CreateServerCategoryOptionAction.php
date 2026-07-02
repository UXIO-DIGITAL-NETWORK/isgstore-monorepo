<?php

namespace App\Actions\Category\ServerCategoryOption;

use App\Models\ServerCategoryOption;
use App\DTOs\Category\ServerCategoryOption\CreateServerCategoryOptionDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class CreateServerCategoryOptionAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(CreateServerCategoryOptionDTO $dto): ServerCategoryOption
    {
        $option = ServerCategoryOption::create([
            'server_category_id' => $dto->serverCategoryId,
            'name' => $dto->name,
            'value' => $dto->value,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Created new Server Category Option: {$option->name}"
        ));

        return $option;
    }
}
