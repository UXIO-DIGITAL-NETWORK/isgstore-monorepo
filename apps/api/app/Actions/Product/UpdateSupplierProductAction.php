<?php

namespace App\Actions\Product;

use App\Models\SupplierProduct;
use App\DTOs\Product\UpdateSupplierProductDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class UpdateSupplierProductAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(SupplierProduct $supplierProduct, UpdateSupplierProductDTO $dto): SupplierProduct
    {
        // If this product is set to active, ensure others for the same product are inactive
        if ($dto->isActive && !$supplierProduct->is_active) {
            SupplierProduct::where('product_id', $dto->productId)
                ->where('id', '!=', $supplierProduct->id)
                ->update(['is_active' => false]);
        }

        $supplierProduct->update([
            'product_id' => $dto->productId,
            'supplier_id' => $dto->supplierId,
            'buyer_sku_code' => $dto->buyerSkuCode,
            'price' => $dto->price,
            'buyer_product_status' => $dto->buyerProductStatus,
            'seller_product_status' => $dto->sellerProductStatus,
            'is_active' => $dto->isActive,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Updated Supplier Product mapping for SKU: {$supplierProduct->buyer_sku_code}"
        ));

        return $supplierProduct->fresh();
    }
}
