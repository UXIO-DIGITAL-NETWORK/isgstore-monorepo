<?php

namespace App\DTOs\PointHistory;

readonly class UpdatePointHistoryDTO
{
    public function __construct(
        public int $userId,
        public ?int $orderId,
        public int $pointsBefore,
        public int $pointsAdded,
        public int $pointsAfter,
        public string $description
    ) {}
}
