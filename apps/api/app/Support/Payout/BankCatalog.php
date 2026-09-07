<?php

declare(strict_types=1);

namespace App\Support\Payout;

/**
 * Thin accessor over config/banks.php — the canonical Monetapay payout catalogue.
 * Drives withdrawal `bank_code` validation and the bank-vs-e-wallet payout routing
 * in ProcessWithdrawalPayoutJob.
 */
final class BankCatalog
{
    /** @return array<int, string> Every valid payout code. */
    public static function codes(): array
    {
        return array_keys((array) config('banks.list', []));
    }

    public static function isEwallet(string $code): bool
    {
        return in_array($code, (array) config('banks.ewallet_codes', []), true);
    }

    public static function name(string $code): ?string
    {
        return config('banks.list.'.$code);
    }
}
