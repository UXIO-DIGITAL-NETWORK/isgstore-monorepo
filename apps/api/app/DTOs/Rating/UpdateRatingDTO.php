<?php

namespace App\DTOs\Rating;

readonly class UpdateRatingDTO
{
    public function __construct(
        public int $transactionId,
        public int $userId,
        public int $rating
    ) {}
}
