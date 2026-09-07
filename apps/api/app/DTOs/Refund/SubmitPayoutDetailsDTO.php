<?php

declare(strict_types=1);

namespace App\DTOs\Refund;

readonly class SubmitPayoutDetailsDTO
{
    public function __construct(
        /** A code from App\Support\Payout\BankCatalog — the same vocabulary withdrawals use. */
        public string $bankCode,
        public ?string $accountNumber,
        public string $accountName,
        /** The wallet id for e-wallet payouts; optional for banks. */
        public ?string $accountPhone = null,
    ) {}
}
