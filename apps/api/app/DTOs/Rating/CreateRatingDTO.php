<?php

namespace App\DTOs\Rating;

readonly class CreateRatingDTO
{
    public function __construct(
        public int $orderId,
        public int $userId,
        public int $rating
    ) {}
}
