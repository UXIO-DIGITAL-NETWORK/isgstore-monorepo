<?php

namespace App\DTOs\Digiflazz;

readonly class CreateDigiflazzProductDTO
{
    /**
     * Selling prices are nullable so the Excel import can leave them blank
     * (PricingService defaults apply); the manual-add endpoint requires all 4.
     */
    public function __construct(
        public string $buyerSkuCode,
        public string $type,
        public int $categoryId,
        public ?int $subCategoryId = null,
        public ?string $name = null,
        public ?string $code = null,
        public ?int $priceMember = null,
        public ?int $priceVip = null,
        public ?int $priceReseller = null,
        public ?int $priceAgent = null,
        public bool $status = false,
    ) {}
}
