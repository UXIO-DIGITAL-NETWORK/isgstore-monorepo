<?php

namespace App\DTOs\Banner;

readonly class CreateBannerDTO
{
    public function __construct(
        public ?int $categoryId,
        public string $name,
        public string $imagePath,
        public ?string $link,
    ) {}
}
