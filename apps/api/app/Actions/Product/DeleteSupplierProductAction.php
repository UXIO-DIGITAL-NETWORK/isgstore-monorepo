<?php

namespace App\Actions\Product;

use App\Models\SupplierProduct;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class DeleteSupplierProductAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(SupplierProduct $supplierProduct): bool
    {
        $skuCode = $supplierProduct->buyer_sku_code;
        $deleted = $supplierProduct->delete();

        if ($deleted) {
            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Deleted Supplier Product mapping for SKU: {$skuCode}"
            ));
        }

        return $deleted;
    }
}
