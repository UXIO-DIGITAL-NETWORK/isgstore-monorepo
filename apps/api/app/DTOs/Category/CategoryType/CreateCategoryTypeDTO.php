<?php

namespace App\DTOs\Category\CategoryType;

readonly class CreateCategoryTypeDTO
{
    public function __construct(
        public string $name,
        public bool $status
    ) {}
}
