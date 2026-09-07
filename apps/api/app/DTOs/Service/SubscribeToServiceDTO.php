<?php

declare(strict_types=1);

namespace App\DTOs\Service;

readonly class SubscribeToServiceDTO
{
    public function __construct(
        public int $merchantId,
        public int $serviceId,
        public int $paymentChannelId,
        public ?string $notes = null,
    ) {}

    public static function fromValidated(array $validated, int $merchantId): self
    {
        return new self(
            merchantId: $merchantId,
            serviceId: (int) $validated['service_id'],
            paymentChannelId: (int) $validated['payment_channel_id'],
            notes: $validated['notes'] ?? null,
        );
    }
}
