<?php

namespace App\DTOs\Payment;

readonly class CreatePaymentDTO
{
    public function __construct(
        public int $orderId,
        public int $paymentMethodId,
        public ?string $pgTransactionId,
        public int $grossAmount,
        public int $adminFee,
        public ?array $paymentData,
        public string $status,
        public ?string $paidAt
    ) {}
}
