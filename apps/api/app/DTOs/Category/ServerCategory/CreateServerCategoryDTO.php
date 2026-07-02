<?php

namespace App\DTOs\Category\ServerCategory;

readonly class CreateServerCategoryDTO
{
    public function __construct(
        public int $categoryId,
        public string $name
    ) {}
}
