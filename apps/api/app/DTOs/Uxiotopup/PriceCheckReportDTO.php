<?php

namespace App\DTOs\Uxiotopup;

readonly class PriceCheckReportDTO
{
    /**
     * @param  array<int,string>  $deactivated  service ids turned off by this run
     * @param  array<int,string>  $reactivated  service ids turned back on by this run
     * @param  array<int,array{sku:string,product:string,cost:int,price_member:int}>  $negativeMargin
     * @param  array<int,string>  $unknownSkusSample  first N service ids with no local mapping (never auto-created)
     */
    public function __construct(
        public int $totalFetched,
        public int $priceChangedCount,
        public int $alertsCreated = 0,
        public int $alertsUpdated = 0,
        public array $deactivated = [],
        public array $reactivated = [],
        public array $negativeMargin = [],
        public int $unknownCount = 0,
        public array $unknownSkusSample = [],
    ) {}

    /**
     * @return array<string,mixed>
     */
    public function toArray(): array
    {
        return [
            'total_fetched' => $this->totalFetched,
            'price_changed' => $this->priceChangedCount,
            'alerts_created' => $this->alertsCreated,
            'alerts_updated' => $this->alertsUpdated,
            'deactivated' => $this->deactivated,
            'reactivated' => $this->reactivated,
            'negative_margin' => $this->negativeMargin,
            'unknown_count' => $this->unknownCount,
            'unknown_skus_sample' => $this->unknownSkusSample,
        ];
    }
}
