<?php

namespace App\DTOs\Banner;

use Illuminate\Http\UploadedFile;

readonly class UpdateBannerDTO
{
    public function __construct(
        public ?int $categoryId,
        public string $name,
        public UploadedFile|string|null $imagePath,
        public ?string $link,
    ) {}
}
