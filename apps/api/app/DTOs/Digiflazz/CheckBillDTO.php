<?php

namespace App\DTOs\Digiflazz;

readonly class CheckBillDTO
{
    public function __construct(
        public string $buyerSkuCode,
        public string $customerNo,
    ) {}
}
