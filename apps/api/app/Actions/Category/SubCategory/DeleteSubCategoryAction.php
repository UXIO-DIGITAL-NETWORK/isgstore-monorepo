<?php

namespace App\Actions\Category\SubCategory;

use App\Models\SubCategory;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage; // Tambahkan facade Storage

class DeleteSubCategoryAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(SubCategory $subCategory): bool
    {
        $name = $subCategory->name;
        $logoPath = $subCategory->logo;

        $deleted = $subCategory->delete();

        if ($deleted) {
            // Hapus file fisik dari storage jika ada
            if ($logoPath && Storage::disk('public')->exists($logoPath)) {
                Storage::disk('public')->delete($logoPath);
            }

            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Deleted Sub Category: {$name}"
            ));
        }

        return $deleted;
    }
}
