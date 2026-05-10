<?php

namespace App\Actions\Category;

use App\Models\SubCategory;
use App\DTOs\Category\CreateSubCategoryDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage; // Tambahkan facade Storage
use Illuminate\Http\UploadedFile;

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
