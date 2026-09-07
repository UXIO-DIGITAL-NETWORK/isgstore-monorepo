<?php

namespace App\Actions\Category\SubCategory;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Category\SubCategory\UpdateSubCategoryDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\SubCategory;
use App\Services\ImageOptimizer;
use Illuminate\Http\UploadedFile; // Tambahkan facade Storage
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class UpdateSubCategoryAction
{
    public function __construct(
        private CreateActivityLogAction $activityLogAction,
        private ImageOptimizer $images,
    ) {}

    public function execute(SubCategory $subCategory, UpdateSubCategoryDTO $dto): SubCategory
    {
        $logoPath = $subCategory->logo;

        // Jika ada file baru yang di-upload
        if ($dto->logo instanceof UploadedFile) {
            // Hapus logo lama dari storage jika ada
            if ($logoPath && Storage::disk('public')->exists($logoPath)) {
                Storage::disk('public')->delete($logoPath);
            }
            // Simpan logo baru
            $logoPath = $this->images->store($dto->logo, 'subcategories/logos');
        }

        $subCategory->update([
            'category_id' => $dto->categoryId,
            'name' => $dto->name,
            'currency_name' => $dto->currencyName,
            'description' => $dto->description,
            'logo' => $logoPath, // Update dengan path baru (atau tetap yang lama)
            'status' => $dto->status,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Updated Sub Category: {$subCategory->name}"
        ));

        return $subCategory->fresh();
    }
}
