<?php

namespace App\DTOs\Supplier;

readonly class UpdateSupplierDTO
{
    public function __construct(
        public string $name,
        public bool $status
    ) {}
}
