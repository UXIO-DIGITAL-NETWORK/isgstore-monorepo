<?php

namespace App\DTOs\Product;

readonly class CreateSupplierProductDTO
{
    public function __construct(
        public int $productId,
        public int $supplierId,
        public string $buyerSkuCode,
        public int $price,
        public bool $buyerProductStatus,
        public bool $sellerProductStatus,
        public bool $isActive
    ) {}
}
