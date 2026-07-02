<?php

namespace App\DTOs\Digiflazz;

readonly class PayBillDTO
{
    public function __construct(
        public int $productId,
        public int $paymentChannelId,
        public string $customerNo,
        public ?int $userId = null,
        public ?string $guestContact = null,
    ) {}
}
