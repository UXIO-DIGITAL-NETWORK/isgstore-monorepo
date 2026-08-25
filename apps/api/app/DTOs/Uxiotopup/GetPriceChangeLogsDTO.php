<?php

namespace App\DTOs\Uxiotopup;

readonly class GetPriceChangeLogsDTO
{
    public function __construct(
        public ?string $status = null,
        public ?string $search = null,
        public ?string $dateFrom = null,
        public ?string $dateTo = null,
        public int $perPage = 15,
    ) {}
}
