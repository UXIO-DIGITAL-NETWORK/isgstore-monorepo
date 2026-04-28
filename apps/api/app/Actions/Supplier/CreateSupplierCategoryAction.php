<?php

namespace App\Actions\Supplier;

use App\Models\SupplierCategory;
use App\DTOs\Supplier\CreateSupplierCategoryDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class CreateSupplierCategoryAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(CreateSupplierCategoryDTO $dto): SupplierCategory
    {
        $supplierCategory = SupplierCategory::create([
            'category_id' => $dto->categoryId,
            'supplier_id' => $dto->supplierId,
            'template_code' => $dto->templateCode,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Created new Supplier Category: {$supplierCategory->template_code}"
        ));

        return $supplierCategory;
    }
}
