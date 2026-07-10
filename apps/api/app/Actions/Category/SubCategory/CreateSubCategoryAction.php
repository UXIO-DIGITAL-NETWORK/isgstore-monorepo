<?php

namespace App\Actions\Category\SubCategory;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Category\SubCategory\CreateSubCategoryDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\SubCategory;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth; // Tambahkan facade Storage
use Illuminate\Support\Facades\Storage;

class CreateSubCategoryAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(CreateSubCategoryDTO $dto): SubCategory
    {
        $logoPath = null;

        // Cek jika logo adalah instansiasi file yang di-upload
        if ($dto->logo instanceof UploadedFile) {
            // Simpan ke disk public, folder 'subcategories/logos'
            $logoPath = $dto->logo->store('subcategories/logos', 'public');
        }

        $subCategory = SubCategory::create([
            'category_id' => $dto->categoryId,
            'name' => $dto->name,
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
