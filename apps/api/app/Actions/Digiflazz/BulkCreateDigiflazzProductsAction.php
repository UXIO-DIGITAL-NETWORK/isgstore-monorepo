<?php

namespace App\Actions\Digiflazz;

use App\DTOs\Digiflazz\CreateDigiflazzProductDTO;
use App\Exceptions\DigiflazzProductException;

/**
 * Add many Digiflazz SKUs into the catalog under one shared category.
 *
 * Each SKU is created through the single-product action inside its own
 * try/catch so a bad row (unknown SKU, already mapped, taken code) never aborts
 * the batch — mirroring the resilient per-row import path. Selling prices are
 * left null so PricingService derives them from each SKU's cost + the category.
 */
class BulkCreateDigiflazzProductsAction
{
    public function __construct(
        private readonly CreateDigiflazzProductAction $createAction
    ) {}

    /**
     * @param  array<int,string>  $buyerSkuCodes
     * @return array{created:int, skipped:array<int,array{buyer_sku_code:string, reason:string}>}
     */
    public function execute(
        array $buyerSkuCodes,
        string $type,
        int $categoryId,
        ?int $subCategoryId,
        bool $status
    ): array {
        $created = 0;
        $skipped = [];

        foreach (array_unique($buyerSkuCodes) as $sku) {
            try {
                $this->createAction->execute(new CreateDigiflazzProductDTO(
                    buyerSkuCode: $sku,
                    type: $type,
                    categoryId: $categoryId,
                    subCategoryId: $subCategoryId,
                    status: $status,
                ));
                $created++;
            } catch (DigiflazzProductException $e) {
                $skipped[] = ['buyer_sku_code' => $sku, 'reason' => $e->getMessage()];
            }
        }

        return ['created' => $created, 'skipped' => $skipped];
    }
}
