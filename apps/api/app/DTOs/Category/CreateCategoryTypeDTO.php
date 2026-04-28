<?php

namespace App\DTOs\Category;

readonly class CreateCategoryTypeDTO
{
    public function __construct(
        public string $name,
        public bool $status
    ) {}
}
