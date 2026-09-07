<?php

declare(strict_types=1);

namespace App\DTOs\Service;

readonly class ConfirmServiceInvoiceDTO
{
    public function __construct(
        public int $invoiceId,
        public int $verifierId,
        public ?string $notes = null,
    ) {}

    public static function fromValidated(array $validated, int $invoiceId, int $verifierId): self
    {
        return new self(
            invoiceId: $invoiceId,
            verifierId: $verifierId,
            notes: $validated['notes'] ?? null,
        );
    }
}
