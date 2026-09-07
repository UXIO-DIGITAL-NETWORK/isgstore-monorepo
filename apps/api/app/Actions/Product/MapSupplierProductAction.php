<?php

namespace App\Actions\Product;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Product;
use App\Models\SupplierProduct;
use Illuminate\Support\Facades\DB;

class MapSupplierProductAction
{
    public function __construct(private readonly CreateActivityLogAction $logAction) {}

    public function execute(int $productId, int $supplierProductId): void
    {
        DB::transaction(function () use ($productId, $supplierProductId) {
            $product = Product::findOrFail($productId);

            // Matikan supplier lama
            SupplierProduct::where('product_id', $productId)->update(['is_active' => false]);

            // Aktifkan supplier baru
            $selectedSupplier = SupplierProduct::findOrFail($supplierProductId);
            $selectedSupplier->update(['product_id' => $productId, 'is_active' => true]);

            $this->logAction->execute(new CreateActivityLogDTO(
                userId: auth()->id(), ipAddress: request()->ip(), userAgent: request()->userAgent(),
                message: "Memetakan SKU Internal {$product->code} ke Seller SKU {$selectedSupplier->buyer_sku_code}"
            ));
        });
    }
}
