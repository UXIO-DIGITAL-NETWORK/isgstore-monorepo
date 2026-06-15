<?php

namespace App\DTOs\Payment\Monetapay;

readonly class MonetapayCallbackDTO
{
    public function __construct(
        public string $outNo,
        public int $amount,
        public string $status,
        public array $rawPayload
    ) {}
}
