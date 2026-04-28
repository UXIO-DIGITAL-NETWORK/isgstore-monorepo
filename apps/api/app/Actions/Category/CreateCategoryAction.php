<?php

namespace App\Actions\Category;

use App\Models\Category;
use App\DTOs\Category\CreateCategoryDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class CreateCategoryAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(CreateCategoryDTO $dto): Category
    {
        $category = Category::create([
            'type_id' => $dto->typeId,
            'name' => $dto->name,
            'code' => $dto->code,
            'validasi_nickname' => $dto->validasiNickname,
            'region' => $dto->region,
            'logo' => $dto->logo,
            'description' => $dto->description,
            'status' => $dto->status,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Created new Category: {$category->name}"
        ));

        return $category;
    }
}
