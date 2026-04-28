<?php

namespace App\DTOs\Category;

readonly class CreateSubCategoryDTO
{
    public function __construct(
        public int $categoryId,
        public string $name,
        public ?string $logo,
        public bool $status
    ) {}
}
