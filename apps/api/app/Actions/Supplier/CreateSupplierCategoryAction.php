<?php

namespace App\Actions\Supplier;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Supplier\CreateSupplierCategoryDTO;
use App\Models\SupplierCategory;
use Illuminate\Support\Facades\Auth;

class CreateSupplierCategoryAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(CreateSupplierCategoryDTO $dto): SupplierCategory
    {
        $supplierCategory = SupplierCategory::create([
            'category_id' => $dto->categoryId,
            'supplier_id' => $dto->supplierId,
            'provider_category' => $dto->providerCategory,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Created new Category Provider: {$supplierCategory->provider_category}"
        ));

        return $supplierCategory;
    }
}
