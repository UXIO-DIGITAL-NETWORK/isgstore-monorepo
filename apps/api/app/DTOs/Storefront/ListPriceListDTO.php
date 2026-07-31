<?php

declare(strict_types=1);

namespace App\DTOs\Storefront;

readonly class ListPriceListDTO
{
    public function __construct(
        public ?string $search = null,
        /** Slug or code — the storefront addresses games by slug, never by id. */
        public ?string $game = null,
        /** 'default' | 'name-asc' | 'price-asc' | 'price-desc' */
        public string $sort = 'default',
        public int $perPage = 10,
    ) {}
}
