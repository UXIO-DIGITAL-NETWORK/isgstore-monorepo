<?php

namespace App\DTOs\Category\SubCategory;

use Illuminate\Http\UploadedFile;

readonly class UpdateSubCategoryDTO
{
    public function __construct(
        public int $categoryId,
        public string $name,
        public UploadedFile|string|null $logo,
        public bool $status
    ) {}
}
