<?php

namespace App\DTOs\Wallet;

readonly class CreateTopupDTO
{
    public function __construct(
        public int $userId,
        public int $paymentChannelId,
        public int $amount,
    ) {}
}
