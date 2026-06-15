<?php

namespace App\DTOs\Payment;

readonly class MonetapayCallbackDTO
{
    public function __construct(
        public string $outNo,
        public int $amount,
        public string $status,
        public array $rawPayload
    ) {}
}
