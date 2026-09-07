<?php

declare(strict_types=1);

namespace App\DTOs\Refund;

readonly class ListRefundRequestsDTO
{
    public function __construct(
        public int $perPage = 15,
        public ?string $status = null,
        public ?string $method = null,
        /** Invoice number, refund number, email, or phone. */
        public ?string $search = null,
        public ?string $startDate = null,
        public ?string $endDate = null,
        /** Owed but never claimed — the outstanding-liability view. */
        public bool $unclaimed = false,
        /** Claimed, still open, and past its 2x24 working-hour promise. */
        public bool $overdue = false,
    ) {}
}
