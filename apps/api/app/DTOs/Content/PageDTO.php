<?php

namespace App\DTOs\Content;

readonly class PageDTO
{
    public function __construct(
        public string $slug,
        public string $locale,
        public string $title,
        public ?array $intro,
        public ?array $sections,
        public bool $isPublished,
        public ?string $metaTitle,
        public ?string $metaDescription,
        public ?string $metaRobots,
    ) {}
}
