<?php

namespace App\Actions\Supplier;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Supplier\UpdateSupplierCategoryDTO;
use App\Models\SupplierCategory;
use Illuminate\Support\Facades\Auth;

class UpdateSupplierCategoryAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(SupplierCategory $supplierCategory, UpdateSupplierCategoryDTO $dto): SupplierCategory
    {
        $supplierCategory->update([
            'category_id' => $dto->categoryId,
            'supplier_id' => $dto->supplierId,
            'provider_category' => $dto->providerCategory,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Updated Category Provider: {$supplierCategory->provider_category}"
        ));

        return $supplierCategory->fresh();
    }
}
