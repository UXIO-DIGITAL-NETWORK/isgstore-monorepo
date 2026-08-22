<?php

namespace App\Actions\Category;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Category\CreateCategoryDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Category;
use App\Services\ImageOptimizer;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;

class CreateCategoryAction
{
    public function __construct(
        private CreateActivityLogAction $activityLogAction,
        private ImageOptimizer $images,
    ) {}

    public function execute(CreateCategoryDTO $dto): Category
    {
        $logoPath = null;

        if ($dto->logo instanceof UploadedFile) {
            $logoPath = $this->images->store($dto->logo, 'categories/logos');
        }

        $ogImagePath = null;

        if ($dto->ogImage instanceof UploadedFile) {
            $ogImagePath = $this->images->store($dto->ogImage, 'categories/og-images');
        }

        $category = Category::create([
            'type_id' => $dto->typeId,
            'name' => $dto->name,
            'sub_name' => $dto->subName,
            'code' => $dto->code,
            'slug' => $dto->slug,
            'uid_parser' => $dto->uidParser,
            'validasi_nickname' => $dto->validasiNickname,
            'nickname_check_enabled' => $dto->nicknameCheckEnabled,
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
            message: "Created new Category: {$category->name}"
        ));

        return $category;
    }
}
