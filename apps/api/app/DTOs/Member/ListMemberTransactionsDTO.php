<?php

declare(strict_types=1);

namespace App\DTOs\Member;

readonly class ListMemberTransactionsDTO
{
    public function __construct(
        public ?string $status = null,
        public ?int $paymentChannelId = null,
        public ?string $dateFrom = null,
        public ?string $dateTo = null,
        public ?string $search = null,
        /** 'newest' | 'oldest' | 'priceHigh' | 'priceLow' */
        public string $sort = 'newest',
        public int $perPage = 10,
    ) {}
}
