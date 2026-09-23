<?php

declare(strict_types=1);

namespace App\Support\Wallet;

use App\Enums\WithdrawalStatus;
use App\Models\PlatformMutation;
use App\Models\Withdrawal;

/**
 * Kita's own withdrawable balance — the platform's accumulated profit, not a
 * merchant's sales.
 *
 * The single definition of "what can kita withdraw right now":
 *
 *   available = income − internalWithdrawnHold
 *
 * `income` is every realised platform_mutations credit: transaction markup
 * (App\Actions\Settlement\SettleMerchantTransactionAction), merchant withdraw
 * fees (App\Support\Ledger\WithdrawalFeeLedger), and service subscription
 * revenue (App\Support\Ledger\ServiceRevenueLedger). `internalWithdrawnHold`
 * mirrors MerchantBalance::withdrawnHold — every non-refunded internal
 * withdrawal (open or settled) — scoped by merchant_id being null instead of
 * a merchant id.
 */
final class PlatformBalance
{
    /**
     * Withdrawals that still hold platform funds: requested, in-flight, or
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

    /**
     * Realised platform income to date. An explicit type whitelist rather than
     * trusting the whole platform_accounts.balance, so a future unrelated
     * mutation type can't silently widen what internal finance can withdraw.
     */
    public static function income(): int
    {
        return (int) PlatformMutation::query()
            ->whereIn('type', ['markup', 'withdrawal_fee', 'service_revenue'])
            ->sum('amount');
    }

    /** Gross amount tied up by non-refunded internal withdrawals (held + settled). */
    public static function internalWithdrawnHold(): int
    {
        return (int) Withdrawal::query()
            ->whereNull('merchant_id')
            ->whereIn('status', self::HELD_STATUSES)
            ->sum('amount');
    }

    /** What kita can withdraw right now. */
    public static function available(): int
    {
        return self::income() - self::internalWithdrawnHold();
    }

    /**
     * `income` and `available` together, from ONE ledger sum.
     *
     * `available` is defined as `income` minus the internal hold, so a caller
     * that wants both — the Hub's summary pull wants exactly these two, as
     * `profit_total` and `platform_available` — would otherwise scan the whole
     * `platform_mutations` ledger twice, every minute. Asking here keeps the
     * single definition and pays for the scan once.
     *
     * @return array{income: int, available: int}
     */
    public static function totals(): array
    {
        $income = self::income();

        return [
            'income' => $income,
            'available' => $income - self::internalWithdrawnHold(),
        ];
    }
}
