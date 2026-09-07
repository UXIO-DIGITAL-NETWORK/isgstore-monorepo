<?php

namespace App\DTOs\Product;

readonly class UpdateSupplierProductDTO
{
    /**
     * `productId` is nullable because a mapping can sit in the provider pool
     * before it is promoted to a Main Product. The admin CRUD endpoint still
     * requires one; pooling goes through PoolUxiolabsSkusAction.
     */
    public function __construct(
        public ?int $productId,
        public int $supplierId,
        public string $buyerSkuCode,
        public int $price,
        public bool $buyerProductStatus,
        public bool $sellerProductStatus,
        public bool $isActive
    ) {}
}
