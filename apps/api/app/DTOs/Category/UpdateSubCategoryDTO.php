<?php

namespace App\DTOs\Category;

readonly class UpdateSubCategoryDTO
{
    public function __construct(
        public int $categoryId,
        public string $name,
        public \Illuminate\Http\UploadedFile|string|null $logo,
        public bool $status
    ) {}
}
