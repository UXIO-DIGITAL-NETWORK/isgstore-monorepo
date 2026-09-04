<?php

namespace App\Actions\Uxiolabs;

use App\DTOs\Uxiolabs\CreateUxiolabsProductDTO;
use App\Exceptions\UxiolabsProductException;

/**
 * Add many uxiolabs services into the catalog under one shared category.
 *
 * Each service is created through the single-product action inside its own
 * try/catch so a bad row (unknown service, already mapped, taken code) never
 * aborts the batch — mirroring the resilient per-row import path. Selling
 * prices are left null so PricingService derives them from each service's
 * cost + the category.
 */
class BulkCreateUxiolabsProductsAction
{
    public function __construct(
        private readonly CreateUxiolabsProductAction $createAction
    ) {}

    /**
     * @param  array<int,string>  $buyerSkuCodes
     * @return array{created:int, skipped:array<int,array{buyer_sku_code:string, reason:string}>}
     */
    public function execute(
        array $buyerSkuCodes,
        int $categoryId,
        ?int $subCategoryId,
        bool $status
    ): array {
        $created = 0;
        $skipped = [];

        foreach (array_unique($buyerSkuCodes) as $sku) {
            try {
                $this->createAction->execute(new CreateUxiolabsProductDTO(
                    buyerSkuCode: $sku,
                    categoryId: $categoryId,
                    subCategoryId: $subCategoryId,
                    status: $status,
                ));
                $created++;
            } catch (UxiolabsProductException $e) {
                $skipped[] = ['buyer_sku_code' => $sku, 'reason' => $e->getMessage()];
            }
        }

        return ['created' => $created, 'skipped' => $skipped];
    }
}
