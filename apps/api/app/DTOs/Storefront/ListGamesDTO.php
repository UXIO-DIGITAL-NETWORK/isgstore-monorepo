<?php

declare(strict_types=1);

namespace App\DTOs\Storefront;

readonly class ListGamesDTO
{
    public function __construct(
        public ?string $search = null,
        public ?int $typeId = null,
        /** 'popular' | 'name' */
        public string $sort = 'name',
        public int $perPage = 24,
    ) {}
}
