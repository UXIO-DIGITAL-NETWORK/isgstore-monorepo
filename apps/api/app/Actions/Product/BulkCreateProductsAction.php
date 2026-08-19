<?php

namespace App\Actions\Product;

use App\Models\Product;
use App\Models\SupplierProduct;
use App\Services\PricingService;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Creates many products at once from a supplier's catalogue (the Add Product
 * Bulk flow). Each item becomes a Product plus a SupplierProduct mapping under
 * one shared supplier + category; selling prices are computed from the item's
 * cost via the pricing rules. Per-row resilient: a duplicate code or bad row is
 * skipped with a reason rather than aborting the batch.
 */
class BulkCreateProductsAction
{
    public function __construct(private PricingService $pricing) {}

    /**
     * @param  array<int,array{code:string,name:string,cost:int,sub_category_id:?int}>  $items
     * @return array{created:int, skipped:array<int,array{code:string,reason:string}>}
     */
    public function execute(int $supplierId, int $categoryId, array $items): array
    {
        $created = 0;
        $skipped = [];

        foreach ($items as $item) {
            $code = (string) ($item['code'] ?? '');

            if ($code === '' || Product::where('code', $code)->exists()) {
                $skipped[] = ['code' => $code, 'reason' => $code === '' ? 'Missing code' : 'Code already exists'];

                continue;
            }

            try {
                DB::transaction(function () use ($item, $supplierId, $categoryId, $code) {
                    $prices = $this->pricing->computePrices((int) $item['cost'], $categoryId);

                    $product = Product::create([
                        'category_id' => $categoryId,
                        'sub_category_id' => $item['sub_category_id'] ?? null,
                        'name' => $item['name'],
                        'code' => $code,
                        'status' => true,
                        'is_available' => true,
                        ...$prices,
                    ]);

                    SupplierProduct::create([
                        'product_id' => $product->id,
                        'supplier_id' => $supplierId,
                        'buyer_sku_code' => $code,
                        'price' => (int) $item['cost'],
                        'is_active' => true,
                    ]);
                });
                $created++;
            } catch (Throwable $e) {
                $skipped[] = ['code' => $code, 'reason' => $e->getMessage()];
            }
        }

        return ['created' => $created, 'skipped' => $skipped];
    }
}
