<?php

namespace App\DTOs\Content;

use Illuminate\Http\UploadedFile;

readonly class TestimonialDTO
{
    public function __construct(
        public string $authorName,
        public ?string $authorTitle,
        public UploadedFile|string|null $avatarPath,
        public string $content,
        public ?int $rating,
        public ?string $gameName,
        public bool $isFeatured,
        public int $sortOrder,
        public bool $isActive,
    ) {}
}
