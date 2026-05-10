<?php

namespace App\DTOs\Banner;

readonly class UpdateBannerDTO
{
    public function __construct(
        public ?int $categoryId,
        public string $name,
        public \Illuminate\Http\UploadedFile|string|null $imagePath,
        public ?string $link,
    ) {}
}
