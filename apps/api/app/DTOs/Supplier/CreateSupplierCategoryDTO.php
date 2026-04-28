<?php

namespace App\DTOs\Supplier;

readonly class CreateSupplierCategoryDTO
{
    public function __construct(
        public int $categoryId,
        public int $supplierId,
        public string $templateCode
    ) {}
}
