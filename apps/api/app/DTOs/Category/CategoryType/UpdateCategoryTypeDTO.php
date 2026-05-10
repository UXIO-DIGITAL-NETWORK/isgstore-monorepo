<?php

namespace App\DTOs\Category\CategoryType;

readonly class UpdateCategoryTypeDTO
{
    public function __construct(
        public string $name,
        public bool $status
    ) {}
}
