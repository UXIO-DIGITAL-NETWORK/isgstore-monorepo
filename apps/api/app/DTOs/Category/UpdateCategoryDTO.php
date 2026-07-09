<?php

namespace App\DTOs\Category;

use Illuminate\Http\UploadedFile;

readonly class UpdateCategoryDTO
{
    public function __construct(
        public int $typeId,
        public string $name,
        public string $code,
        public ?string $validasiNickname,
        public ?string $region,
        public UploadedFile|string|null $logo,
        public ?string $description,
        public bool $status
    ) {}
}
