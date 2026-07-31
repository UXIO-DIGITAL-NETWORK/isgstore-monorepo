<?php

namespace App\DTOs\Article;

readonly class ArticleCategoryDTO
{
    public function __construct(
        public string $name,
        public ?string $key,
        public int $sortOrder,
        public bool $status,
    ) {}
}
