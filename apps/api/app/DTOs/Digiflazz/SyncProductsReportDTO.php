<?php

namespace App\DTOs\Digiflazz;

readonly class SyncProductsReportDTO
{
    /**
     * @param  array<int,array{sku:string,name:string,category:string}>  $newProducts
     * @param  array<int,string>  $deactivated  buyer_sku_codes turned off by this run
     * @param  array<int,string>  $reactivated  buyer_sku_codes turned back on by this run
     * @param  array<int,array{sku:string,product:string,cost:int,price_member:int}>  $negativeMargin
     * @param  array<int,string>  $unmappedBrands  Digiflazz brands that fell back to `uncategorized`
     * @param  array<int,string>  $skippedSkus  SKUs skipped due to product code collisions or bad data
     */
    public function __construct(
        public string $type,
        public int $totalFetched,
        public int $priceChangedCount,
        public array $newProducts = [],
        public array $deactivated = [],
        public array $reactivated = [],
        public array $negativeMargin = [],
        public array $unmappedBrands = [],
        public array $skippedSkus = [],
    ) {}

    /**
     * @return array<string,mixed>
     */
    public function toArray(): array
    {
        return [
            'type' => $this->type,
            'total_fetched' => $this->totalFetched,
            'price_changed' => $this->priceChangedCount,
            'new_products' => $this->newProducts,
            'deactivated' => $this->deactivated,
            'reactivated' => $this->reactivated,
            'negative_margin' => $this->negativeMargin,
            'unmapped_brands' => $this->unmappedBrands,
            'skipped_skus' => $this->skippedSkus,
        ];
    }
}
