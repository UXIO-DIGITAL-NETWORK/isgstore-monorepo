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

        $ogImagePath = $category->og_image;

        if ($dto->ogImage instanceof UploadedFile) {
            if ($ogImagePath && Storage::disk('public')->exists($ogImagePath)) {
                Storage::disk('public')->delete($ogImagePath);
            }
            $ogImagePath = $dto->ogImage->store('categories/og-images', 'public');
        }

        $category->update([
            'type_id' => $dto->typeId,
            'name' => $dto->name,
            'sub_name' => $dto->subName,
            'code' => $dto->code,
            'slug' => $dto->slug,
            'uid_parser' => $dto->uidParser,
            'validasi_nickname' => $dto->validasiNickname,
            'region' => $dto->region,
            'logo' => $logoPath,
            'description' => $dto->description,
            'status' => $dto->status,
            'order_form_fields' => $dto->orderFormFields,
            'meta_title' => $dto->metaTitle,
            'meta_description' => $dto->metaDescription,
            'og_image' => $ogImagePath,
            'meta_keywords' => $dto->metaKeywords,
            'meta_robots' => $dto->metaRobots,
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
