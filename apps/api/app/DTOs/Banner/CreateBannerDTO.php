<?php

namespace App\DTOs\Banner;

readonly class CreateBannerDTO
{
    public function __construct(
        public ?int $categoryId,
        public string $name,
        public \Illuminate\Http\UploadedFile|string|null $imagePath,
        public ?string $link,
    ) {}
}
