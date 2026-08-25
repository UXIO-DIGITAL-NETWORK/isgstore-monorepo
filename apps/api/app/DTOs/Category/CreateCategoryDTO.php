<?php

namespace App\DTOs\Category;

use Illuminate\Http\UploadedFile;

readonly class CreateCategoryDTO
{
    /**
     * @param  array<int, array{key: string, label?: string|null, required?: bool}>|null  $orderFormFields
     * @param  array<int, string>|null  $metaKeywords
     */
    public function __construct(
        public int $typeId,
        public string $name,
        public ?string $subName,
        public string $code,
        public ?string $slug,
        public ?string $uidParser,
        public ?string $validasiNickname,
        public bool $nicknameCheckEnabled,
        public ?string $region,
        public UploadedFile|string|null $logo,
        public UploadedFile|string|null $thumbnail,
        public UploadedFile|string|null $banner,
        public ?string $description,
        public bool $status,
        public ?array $orderFormFields,
        public ?string $metaTitle,
        public ?string $metaDescription,
        public UploadedFile|string|null $ogImage,
        public ?array $metaKeywords,
        public ?string $metaRobots,
    ) {}
}
