<?php

declare(strict_types=1);

namespace App\Support\Withdrawal;

/**
 * The flat withdraw fee, independent of the amount: fee_flat + fee_percent%
 * of fee_flat (1500 + 11% × 1500 = 1665 with the defaults). Shared by every
 * withdrawal request action — merchant and internal alike — so the schedule
 * can never drift between them.
 */
final class WithdrawalFeeCalculator
{
    public static function fee(): int
    {
        $flat = (int) config('services.withdrawal.fee_flat', 0);
        $percent = (float) config('services.withdrawal.fee_percent', 0);

        return $flat + (int) round($flat * ($percent / 100));
    }
}
