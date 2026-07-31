<?php

namespace App\DTOs\Article;

use Illuminate\Http\UploadedFile;

readonly class CreateArticleDTO
{
    public function __construct(
        public int $articleCategoryId,
        public ?string $categoryLabel,
        public string $type,
        public string $locale,
        public string $title,
        public ?string $slug,
        public ?string $excerpt,
        public string $authorName,
        public ?array $bodySections,
        public UploadedFile|string|null $imagePath,
        public bool $isPublished,
        public bool $isFeatured,
        public ?string $publishedAt,
        public ?string $metaTitle,
        public ?string $metaDescription,
        public ?array $metaKeywords,
        public ?string $metaRobots,
    ) {}
}
