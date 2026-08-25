<?php

declare(strict_types=1);

namespace App\Actions\Product;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Exceptions\SupplierProductPoolException;
use App\Models\Product;
use App\Models\SupplierProduct;
use App\Services\PricingService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Promotes a priced pool row into a Main Product — as a DRAFT.
 *
 * Two things stay off deliberately:
 *
 *  - `products.status = false`, so `Catalog::sellableProducts()` skips it.
 *  - `supplier_products.is_active = false`, the second, independent gate.
 *
 * Publishing is a separate, explicit act (PublishSupplierProductAction). That is
 * why this does NOT reuse MapSupplierProductAction, which activates the mapping:
 * a draft that arrives pre-activated is one `status` flip away from being sold.
 */
class PromoteSupplierProductAction
{
    public function __construct(
        private readonly PricingService $pricing,
        private readonly CreateActivityLogAction $activityLogAction,
        private readonly RestoreProductAction $restoreAction,
    ) {}

    /**
     * @throws SupplierProductPoolException
     */
    public function execute(
        SupplierProduct $supplierProduct,
        ?int $categoryId = null,
        ?int $subCategoryId = null,
        ?string $name = null,
        ?string $code = null,
    ): Product {
        // The gate the whole pipeline exists for: no price decision, no product.
        if ($reason = $supplierProduct->promoteBlockedReason()) {
            throw new SupplierProductPoolException($reason);
        }

        $categoryId ??= $supplierProduct->pool_category_id;
        $code = trim((string) ($code ?? $supplierProduct->buyer_sku_code));

        if ($code === '') {
            throw new SupplierProductPoolException('Kode produk tidak boleh kosong.');
        }

        // withTrashed: an archived product still holds its code — the unique
        // index does not forget, so neither may this check.
        $existing = Product::withTrashed()->where('code', $code)->first();

        if ($existing) {
            // A live (or draft) product already owns this code — a genuine clash
            // the admin has to resolve. Nothing to reuse.
            if (! $existing->trashed()) {
                throw new SupplierProductPoolException("Kode produk '{$code}' sudah dipakai produk lain.");
            }

            // The code belongs to a product that was archived. Same code = same
            // catalogue identity, and archiving freed this very SKU back to the
            // pool — so promoting it is the admin asking for that product back.
            // Restore re-attaches the SKU and returns it unpublished; no second
            // draft, no unique-index clash. Matches what "promote it back" means.
            return $this->restoreAction->execute($existing);
        }

        return DB::transaction(function () use ($supplierProduct, $categoryId, $subCategoryId, $name, $code) {
            $margins = array_filter([
                'member' => $supplierProduct->margin_member,
                'vip' => $supplierProduct->margin_vip,
                'reseller' => $supplierProduct->margin_reseller,
                'agent' => $supplierProduct->margin_agent,
            ], fn ($margin) => $margin !== null);

            // All five price columns are NOT NULL with no default, so they have to
            // be resolved here — from the margins the admin already decided.
            $prices = $this->pricing->computePrices(
                (int) $supplierProduct->price,
                $categoryId,
                $margins,
                $supplierProduct->price_min,
                $supplierProduct->price_max,
            );

            $product = Product::create([
                'category_id' => $categoryId,
                'sub_category_id' => $subCategoryId,
                'name' => $name ?: ($supplierProduct->provider_name ?: $supplierProduct->buyer_sku_code),
                'code' => $code,
                'status' => false,
                'published_at' => null,
                'price_min' => $supplierProduct->price_min,
                'price_max' => $supplierProduct->price_max,
                ...$prices,
            ]);

            $supplierProduct->update([
                'product_id' => $product->id,
                'pool_category_id' => $categoryId,
                'is_active' => false,
            ]);

            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Promoted provider SKU {$supplierProduct->buyer_sku_code} to draft product {$product->code}",
            ));

            return $product;
        });
    }
}
