<?php

namespace App\DTOs\Spending;

readonly class UpdateUserSpendingDTO
{
    public function __construct(
        public int $userId,
        public int $amount
    ) {}
}
