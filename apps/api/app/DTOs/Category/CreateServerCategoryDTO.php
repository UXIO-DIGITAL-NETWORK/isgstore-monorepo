<?php

namespace App\DTOs\Category;

readonly class CreateServerCategoryDTO
{
    public function __construct(
        public int $categoryId,
        public string $name
    ) {}
}
