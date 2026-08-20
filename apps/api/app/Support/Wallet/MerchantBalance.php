<?php

declare(strict_types=1);

namespace App\Support\Wallet;

use App\Enums\TransactionStatus;
use App\Enums\WithdrawalStatus;
use App\Models\Transaction;
use App\Models\Withdrawal;

/**
 * A payment-page merchant's ("client") withdrawable balance, derived live from
 * its own sales and withdrawals — not from `users.balance`.
 *
 * The single definition of "what can this merchant withdraw right now":
 *
 *   available = salesTotal − withdrawnHold
 *
 * where `salesTotal` is every paid sale credited to the merchant and
 * `withdrawnHold` is every non-refunded withdrawal (still open or already
 * settled). REJECTED/FAILED withdrawals returned the money, so they are
 * excluded and the merchant's available balance recovers automatically.
 *
 * Computing this from `transactions` + `withdrawals` keeps it correct even if a
 * settlement credit into `users.balance` lags or is missed.
 */
final class MerchantBalance
{
    /**
     * Withdrawals that still hold the merchant's money: requested, in-flight, or
     * settled. Excludes REJECTED and FAILED (both returned the funds).
     *
     * @var list<WithdrawalStatus>
     */
    private const HELD_STATUSES = [
        WithdrawalStatus::PENDING,
        WithdrawalStatus::APPROVED,
        WithdrawalStatus::PROCESSING,
        WithdrawalStatus::SETTLED,
    ];

    /** Total earned: paid sales (amount_base) attributed to this merchant. */
    public static function salesTotal(int $userId): int
    {
        return (int) Transaction::query()
            ->where('merchant_id', $userId)
            ->whereIn('status', TransactionStatus::paidStates())
            ->sum('amount_base');
    }

    /** Gross amount tied up by non-refunded withdrawals (held + settled). */
    public static function withdrawnHold(int $userId): int
    {
        return (int) Withdrawal::query()
            ->where('merchant_id', $userId)
            ->whereIn('status', self::HELD_STATUSES)
            ->sum('amount');
    }

    /** Withdrawals still awaiting a terminal result (not yet settled). */
    public static function pending(int $userId): int
    {
        return (int) Withdrawal::query()
            ->where('merchant_id', $userId)
            ->whereIn('status', [
                WithdrawalStatus::PENDING,
                WithdrawalStatus::APPROVED,
                WithdrawalStatus::PROCESSING,
            ])
            ->sum('amount');
    }

    /** What the merchant can withdraw right now. */
    public static function available(int $userId): int
    {
        return self::salesTotal($userId) - self::withdrawnHold($userId);
    }
}
