<?php

namespace App\DTOs\PointHistory;

readonly class CreatePointHistoryDTO
{
    public function __construct(
        public int $userId,
        public ?int $transactionId,
        public int $pointsBefore,
        public int $pointsAdded,
        public int $pointsAfter,
        public string $description
    ) {}
}
