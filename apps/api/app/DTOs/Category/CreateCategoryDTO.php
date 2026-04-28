<?php

namespace App\DTOs\Category;

readonly class CreateCategoryDTO
{
    public function __construct(
        public int $typeId,
        public string $name,
        public string $code,
        public ?string $validasiNickname,
        public ?string $region,
        public ?string $logo,
        public ?string $description,
        public bool $status
    ) {}
}
