<?php

namespace App\Actions\Category\SubCategory;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Category\SubCategory\CreateSubCategoryDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\SubCategory;
use App\Services\ImageOptimizer;
use Illuminate\Http\UploadedFile; // Tambahkan facade Storage
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class CreateSubCategoryAction
{
    public function __construct(
        private CreateActivityLogAction $activityLogAction,
        private ImageOptimizer $images,
    ) {}

    public function execute(CreateSubCategoryDTO $dto): SubCategory
    {
        $logoPath = null;

        // Cek jika logo adalah instansiasi file yang di-upload
        if ($dto->logo instanceof UploadedFile) {
            // Simpan ke disk public, folder 'subcategories/logos'
            $logoPath = $this->images->store($dto->logo, 'subcategories/logos');
        }

        $subCategory = SubCategory::create([
            'category_id' => $dto->categoryId,
            'name' => $dto->name,
            'currency_name' => $dto->currencyName,
            'description' => $dto->description,
            'logo' => $logoPath, // Simpan path ke database
            'status' => $dto->status,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Created new Sub Category: {$subCategory->name}"
        ));

        return $subCategory;
    }
}
