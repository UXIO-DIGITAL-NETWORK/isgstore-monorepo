<?php

declare(strict_types=1);

namespace App\Actions\Product;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Exceptions\SupplierProductPoolException;
use App\Models\Product;
use App\Models\SupplierProduct;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Publishes a promoted mapping — the one act that makes a product sellable.
 *
 * `Catalog::sellableProducts()` needs both halves (`products.status = true` and
 * an `is_active` mapping), so both are set here and nowhere else in this pipeline.
 * MapSupplierProductAction supplies the mapping half: it deactivates sibling
 * mappings first, keeping the "one active supplier per product" rule that
 * checkout's `supplierProducts->first()` quietly depends on.
 */
class PublishSupplierProductAction
{
    public function __construct(
        private readonly MapSupplierProductAction $mapAction,
        private readonly CreateActivityLogAction $activityLogAction,
    ) {}

    /**
     * @throws SupplierProductPoolException
     */
    public function execute(SupplierProduct $supplierProduct): Product
    {
        if ($supplierProduct->product_id === null) {
            throw new SupplierProductPoolException('Promote ke produk utama terlebih dahulu.');
        }

        // Publishing a SKU the provider has switched off would advertise an order
        // that checkout can only fail — Catalog checks `is_active`, not upstream
        // availability.
        if (! $supplierProduct->buyer_product_status) {
            throw new SupplierProductPoolException('SKU sedang nonaktif di provider.');
        }

        return DB::transaction(function () use ($supplierProduct) {
            $this->mapAction->execute($supplierProduct->product_id, $supplierProduct->id);

            $product = Product::findOrFail($supplierProduct->product_id);
            $product->update([
                'status' => true,
                // Kept from the first publish so a republish does not rewrite history.
                'published_at' => $product->published_at ?? now(),
            ]);

            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Published product {$product->code} (provider SKU {$supplierProduct->buyer_sku_code})",
            ));

            return $product->fresh();
        });
    }
}
