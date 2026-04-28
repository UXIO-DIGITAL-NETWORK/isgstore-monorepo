<?php

namespace App\DTOs\Rating;

readonly class UpdateRatingDTO
{
    public function __construct(
        public int $orderId,
        public int $userId,
        public int $rating
    ) {}
}
