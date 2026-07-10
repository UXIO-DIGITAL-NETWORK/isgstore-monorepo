<?php

namespace App\Actions\Category\SubCategory;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Category\SubCategory\UpdateSubCategoryDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\SubCategory;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth; // Tambahkan facade Storage
use Illuminate\Support\Facades\Storage;

class UpdateSubCategoryAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

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
            $logoPath = $dto->logo->store('subcategories/logos', 'public');
        }

        $subCategory->update([
            'category_id' => $dto->categoryId,
            'name' => $dto->name,
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
