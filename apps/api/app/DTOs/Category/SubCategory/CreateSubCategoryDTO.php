<?php

namespace App\DTOs\Category\SubCategory;

use Illuminate\Http\UploadedFile;

readonly class CreateSubCategoryDTO
{
    public function __construct(
        public int $categoryId,
        public string $name,
        public ?string $currencyName,
        public ?string $description,
        public UploadedFile|string|null $logo,
        public bool $status
    ) {}
}
