<?php

namespace App\DTOs\Payment\Monetapay;

readonly class MonetapayTransactionDTO
{
    public function __construct(
        public string $referenceId,
        public int $amount,
        public string $channel,
        public array $customerData = []
    ) {}
}
