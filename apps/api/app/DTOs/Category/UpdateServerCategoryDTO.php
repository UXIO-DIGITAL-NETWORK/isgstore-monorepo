<?php

namespace App\DTOs\Category;

readonly class UpdateServerCategoryDTO
{
    public function __construct(
        public int $categoryId,
        public string $name
    ) {}
}
