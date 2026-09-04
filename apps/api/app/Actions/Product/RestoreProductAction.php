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
 * Brings an archived product back, and re-attaches the SKU it was archived with.
 *
 * It comes back UNPUBLISHED, never live. Archiving is usually a decision, and a
 * restore that silently put the product back on sale would make undoing a
 * mistake indistinguishable from making a new one.
 *
 * Refused when the SKU has since been promoted into a different product:
 * `supplier_products` is unique on (supplier, sku), so one SKU cannot serve two
 * products, and the newer one is the one the admin actually chose.
 */
class RestoreProductAction
{
    public function __construct(private readonly CreateActivityLogAction $activityLogAction) {}

    /**
     * @throws SupplierProductPoolException
     */
    public function execute(Product $product): Product
    {
        if (! $product->trashed()) {
            throw new SupplierProductPoolException('Produk ini tidak sedang diarsipkan.');
        }

        // The archive detached the mapping, so the link back is the SKU itself:
        // whichever pooled rows still carry this product's category and are free.
        $claimed = SupplierProduct::whereIn('buyer_sku_code', $this->skusOf($product))
            ->whereNotNull('product_id')
            ->exists();

        if ($claimed) {
            throw new SupplierProductPoolException('SKU produk ini sudah dipakai produk lain.');
        }

        return DB::transaction(function () use ($product) {
            $product->restore();
            $product->update(['status' => false]);

            SupplierProduct::whereIn('buyer_sku_code', $this->skusOf($product))
                ->whereNull('product_id')
                ->update(['product_id' => $product->id, 'is_active' => false]);

            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Restored product {$product->code}",
            ));

            return $product->fresh(['supplierProducts']);
        });
    }

    /**
     * The archived product's own code is the uxiolabs service id — every path
     * that creates one (promote, manual add, Excel import) copies it across.
     *
     * @return array<int,string>
     */
    private function skusOf(Product $product): array
    {
        return array_filter([(string) $product->code]);
    }
}
