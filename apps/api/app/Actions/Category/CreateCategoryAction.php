<?php

namespace App\Actions\Category;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Category\CreateCategoryDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Category;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;

class CreateCategoryAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(CreateCategoryDTO $dto): Category
    {
        $logoPath = null;

        if ($dto->logo instanceof UploadedFile) {
            $logoPath = $dto->logo->store('categories/logos', 'public');
        }

        $category = Category::create([
            'type_id' => $dto->typeId,
            'name' => $dto->name,
            'code' => $dto->code,
            'validasi_nickname' => $dto->validasiNickname,
            'region' => $dto->region,
            'logo' => $logoPath,
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
