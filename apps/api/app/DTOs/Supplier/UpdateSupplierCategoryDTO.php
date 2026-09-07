<?php

namespace App\DTOs\Supplier;

readonly class UpdateSupplierCategoryDTO
{
    public function __construct(
        public int $categoryId,
        public int $supplierId,
        public string $providerCategory
    ) {}
}
