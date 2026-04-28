<?php

namespace App\Actions\Product;

use App\Models\SupplierProduct;
use App\DTOs\Product\CreateSupplierProductDTO;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class CreateSupplierProductAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(CreateSupplierProductDTO $dto): SupplierProduct
    {
        // If this product is set to active, ensure others for the same product are inactive
        if ($dto->isActive) {
            SupplierProduct::where('product_id', $dto->productId)
                ->update(['is_active' => false]);
        }

        $supplierProduct = SupplierProduct::create([
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
            message: "Created new Supplier Product mapping for SKU: {$supplierProduct->buyer_sku_code}"
        ));

        return $supplierProduct;
    }
}
