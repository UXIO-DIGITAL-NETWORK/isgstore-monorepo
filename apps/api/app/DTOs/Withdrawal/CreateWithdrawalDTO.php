<?php

declare(strict_types=1);

namespace App\DTOs\Withdrawal;

readonly class CreateWithdrawalDTO
{
    public function __construct(
        public int $merchantId,
        public int $amount,
        public string $bankCode,
        public string $accountNumber,
        public string $accountName,
        public ?string $notes = null,
    ) {}

    public static function fromValidated(array $validated, int $merchantId): self
    {
        return new self(
            merchantId: $merchantId,
            amount: (int) $validated['amount'],
            bankCode: $validated['bank_code'],
            accountNumber: $validated['account_number'],
            accountName: $validated['account_name'],
            notes: $validated['notes'] ?? null,
        );
    }
}
