<?php

namespace App\DTOs\Supplier;

readonly class CreateSupplierDTO
{
    public function __construct(
        public string $name,
        public bool $status
    ) {}
}
