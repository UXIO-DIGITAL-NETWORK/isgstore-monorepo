<?php

namespace App\DTOs\Product;

use Illuminate\Http\UploadedFile;

readonly class CreateProductDTO
{
    public function __construct(
        public int $categoryId,
        public ?int $subCategoryId,
        public string $name,
        public ?string $subName,
        public string $code,
        public UploadedFile|string|null $logo,
        public ?string $description,
        public ?string $validasiNickname,
        public ?string $access,
        public ?string $tag,
        public int $priceModal,
        public int $priceMember,
        public int $priceVip,
        public int $priceReseller,
        public int $priceAgent,
        public bool $status,
        public bool $isAvailable
    ) {}
}
