<?php

namespace App\DTOs\Product;

readonly class UpdateProductDTO
{
    public function __construct(
        public int $categoryId,
        public ?int $subCategoryId,
        public string $name,
        public string $code,
        public int $priceModal,
        public int $priceMember,
        public int $priceVip,
        public int $priceReseller,
        public int $priceAgent,
        public bool $status
    ) {}
}
