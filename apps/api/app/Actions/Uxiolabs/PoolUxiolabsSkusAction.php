<?php

declare(strict_types=1);

namespace App\Actions\Uxiolabs;

use App\Actions\Log\CreateActivityLogAction;
use App\Contracts\SupplierGateway;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\SupplierCategory;
use App\Models\SupplierProduct;
use App\Support\Uxiolabs\UxiolabsSupplier;
use Illuminate\Support\Facades\Auth;

/**
 * Pulls provider SKUs into the pool.
 *
 * A pooled row is a `supplier_products` record with **no product**: the SKU is
 * ours to manage, but it sells nothing yet. Two invariants make that safe:
 *
 *  - `product_id` is null, so `Catalog::sellableProducts()` — which starts from
 *    `products` — cannot reach it by construction.
 *  - `is_active` is false, so even a later mis-promotion cannot expose it before
 *    someone publishes deliberately.
 *
 * Resilient per row, like BulkCreateUxiolabsProductsAction: one unknown SKU in a
 * selection of 200 must not lose the other 199.
 */
class PoolUxiolabsSkusAction
{
    public function __construct(
        private readonly SupplierGateway $uxiolabsService,
        private readonly CreateActivityLogAction $activityLogAction,
    ) {}

    /**
     * @param  array<int,string>  $buyerSkuCodes
     * @return array{pooled:int,skipped:array<int,array{buyer_sku_code:string,reason:string}>}
     */
    public function execute(array $buyerSkuCodes): array
    {
        $supplier = UxiolabsSupplier::model();

        if (! $supplier) {
            return [
                'pooled' => 0,
                'skipped' => array_map(fn ($sku) => [
                    'buyer_sku_code' => (string) $sku,
                    'reason' => 'Supplier Uxiotopup belum terdaftar.',
                ], array_values(array_unique($buyerSkuCodes))),
            ];
        }

        // Indexed once for the whole batch. Looking each SKU up through
        // findServiceInPriceList() would rescan an MB-sized list per row.
        $priceList = $this->uxiolabsService->keyedPriceListCached();

        $mappings = SupplierCategory::where('supplier_id', $supplier->id)
            ->pluck('category_id', 'provider_category');

        $existing = SupplierProduct::where('supplier_id', $supplier->id)
            ->pluck('buyer_sku_code')
            ->flip();

        $skipped = [];
        $insert = [];
        $now = now();

        foreach (array_values(array_unique($buyerSkuCodes)) as $sku) {
            $sku = (string) $sku;
            $item = $priceList[$sku] ?? null;

            if ($item === null) {
                $skipped[] = ['buyer_sku_code' => $sku, 'reason' => 'Layanan tidak ditemukan di price list Uxiotopup.'];

                continue;
            }

            if (isset($existing[$sku])) {
                $skipped[] = ['buyer_sku_code' => $sku, 'reason' => 'SKU sudah ada di pool provider.'];

                continue;
            }

            $kategori = trim((string) ($item['kategori'] ?? ''));
            $categoryId = $mappings->get($kategori);

            if ($categoryId === null) {
                $skipped[] = [
                    'buyer_sku_code' => $sku,
                    'reason' => "Kategori provider '{$kategori}' belum dipetakan di Category Provider.",
                ];

                continue;
            }

            $cost = $this->uxiolabsService->costFor($item);

            if ($cost <= 0) {
                $skipped[] = ['buyer_sku_code' => $sku, 'reason' => 'Harga modal dari Uxiotopup tidak valid.'];

                continue;
            }

            $available = $this->uxiolabsService->isItemActive($item);

            $insert[] = [
                'product_id' => null,
                'supplier_id' => $supplier->id,
                'pool_category_id' => $categoryId,
                'buyer_sku_code' => $sku,
                'provider_name' => (string) ($item['nama_layanan'] ?? $sku),
                'price' => $cost,
                'admin_fee' => null,
                'commission' => null,
                'buyer_product_status' => $available,
                'seller_product_status' => $available,
                // Never active while pooled — the second storefront gate.
                'is_active' => false,
                'is_price_locked' => false,
                'margin_set_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            // Guard against the same SKU appearing twice in one payload.
            $existing[$sku] = true;
        }

        if ($insert !== []) {
            SupplierProduct::insert($insert);

            // One log line for the batch: 200 rows must not mean 200 log rows.
            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: 'Pooled '.count($insert).' Uxiotopup SKU into the provider pool',
            ));
        }

        return ['pooled' => count($insert), 'skipped' => $skipped];
    }
}
