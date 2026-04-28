<?php

namespace App\DTOs\Payment;

readonly class MonetapayCallbackDTO
{
    public function __construct(
        public string $referenceId,
        public int $amount,
        public string $status,
        public string $signature,
        public array $rawPayload
    ) {}
}
