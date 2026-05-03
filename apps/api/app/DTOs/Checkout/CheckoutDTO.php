<?php

namespace App\DTOs\Checkout;

readonly class CheckoutDTO
{
    public function __construct(
        public int $userId,
        public int $productId,
        public int $paymentMethodId,
        public string $targetUid,
        public ?string $targetServer = null
    ) {}
}
