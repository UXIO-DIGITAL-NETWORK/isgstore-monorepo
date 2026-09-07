<?php

namespace App\DTOs\Product;

use Illuminate\Http\UploadedFile;

readonly class UpdateProductDTO
{
    public function __construct(
        public int $categoryId,
        public ?int $subCategoryId,
        public string $name,
        public ?string $subName,
        public string $code,
        public UploadedFile|string|null $logo,
        public ?string $description,
        public ?string $validasiNickname,
        public ?string $access,
        public ?string $tag,
        public int $priceModal,
        public int $priceMember,
        public int $priceVip,
        public int $priceReseller,
        public int $priceAgent,
        public bool $status,
        public bool $isAvailable,
        /**
         * Loyalty points this product earns, overriding the `points` settings.
         * Null means "use the global fallback" — an unpriced-for-points SKU
         * still earns rather than silently becoming worthless to the customer.
         */
        public ?float $pointPercent = null,
        public ?int $pointFlat = null,
    ) {}
}
