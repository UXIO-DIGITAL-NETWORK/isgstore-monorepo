<?php

namespace App\DTOs\Category;

readonly class UpdateServerCategoryOptionDTO
{
    public function __construct(
        public int $serverCategoryId,
        public string $name,
        public string $value
    ) {}
}
