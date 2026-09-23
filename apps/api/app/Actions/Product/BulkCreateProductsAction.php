<?php

namespace App\Actions\Product;

use App\Actions\Pricing\WriteProductPricesAction;
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
    public function __construct(
        private PricingService $pricing,
        private WriteProductPricesAction $writePrices,
    ) {}

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

            // withTrashed: an archived product still occupies its code.
            if ($code === '' || Product::withTrashed()->where('code', $code)->exists()) {
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

                    // …and the same prices where they are billed. The five columns
                    // above are NOT NULL and have to be supplied, but they are a
                    // copy: a product created with only those has no plan row, and
                    // `PlanPrice` can only serve it by falling back and warning.
                    $this->writePrices->forPlans(
                        $product,
                        $this->pricing->computePlanPrices((int) $item['cost'], $categoryId),
                        overwriteManual: true,
                    );
                });
                $created++;
            } catch (Throwable $e) {
                $skipped[] = ['code' => $code, 'reason' => $e->getMessage()];
            }
        }

        return ['created' => $created, 'skipped' => $skipped];
    }
}
