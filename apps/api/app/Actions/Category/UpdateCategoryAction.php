<?php

namespace App\Actions\Category;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Category\UpdateCategoryDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Category;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class UpdateCategoryAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Category $category, UpdateCategoryDTO $dto): Category
    {
        $logoPath = $category->logo;

        if ($dto->logo instanceof UploadedFile) {
            if ($logoPath && Storage::disk('public')->exists($logoPath)) {
                Storage::disk('public')->delete($logoPath);
            }
            $logoPath = $dto->logo->store('categories/logos', 'public');
        }

        $category->update([
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
            message: "Updated Category: {$category->name}"
        ));

        return $category->fresh();
    }
}
