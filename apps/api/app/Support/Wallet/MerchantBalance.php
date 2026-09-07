<?php

declare(strict_types=1);

namespace App\Support\Wallet;

use App\Enums\TransactionStatus;
use App\Enums\WithdrawalStatus;
use App\Models\Transaction;
use App\Models\Withdrawal;
use App\Support\Payment\MonetapayContractFees;
use Illuminate\Database\Eloquent\Builder;

/**
 * A payment-page merchant's ("client") withdrawable balance, derived live from
 * its own sales and withdrawals — not from `users.balance`.
 *
 * The single definition of "what can this merchant withdraw right now":
 *
 *   available = settledSalesTotal − withdrawnHold
 *
 * `settledSalesTotal` is every paid sale that has cleared its holding period:
 * the channel's Monetapay settlement window (T+n, a contract fact from
 * MonetapayContractFees) plus a fraud buffer (`withdrawal.hold_buffer_days`, a
 * policy knob). Until then the sale sits in `heldSalesTotal` — money the
 * merchant has earned but cannot withdraw yet, shown as "Saldo Tertahan".
 * The holding period is the platform's only protection against a partner
 * selling at 10:00 and draining the payout at 10:05 on a fraudulent sale.
 *
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

    /** Total earned: paid sales (amount_base) attributed to this merchant, holding period ignored. */
    public static function salesTotal(int $userId): int
    {
        return (int) self::paidSales($userId)->sum('transactions.amount_base');
    }

    /**
     * Paid sales that have cleared their holding period (settlement + buffer)
     * and are therefore withdrawable.
     *
     * The clock starts at `payments.paid_at` (falling back to the transaction's
     * own created_at when no payment row carries a timestamp — the balance
     * channel marks payment inline). Channels are grouped by their contract
     * settlement_days so this stays a handful of indexed queries; a channel the
     * contract doesn't know (or a row with no channel) settles at T+0 — the
     * buffer alone still applies, so nothing is ever withdrawable same-day.
     */
    public static function settledSalesTotal(int $userId): int
    {
        $buffer = max(0, (int) config('services.withdrawal.hold_buffer_days', 1));
        $total = 0;

        foreach (self::channelCodesBySettlementDays() as $days => $codes) {
            $cutoff = now()->subDays($days + $buffer);

            $total += (int) self::paidSales($userId)
                ->join('payment_channels', 'payment_channels.id', '=', 'transactions.payment_channel_id')
                ->whereIn('payment_channels.channel_code', $codes)
                ->leftJoin('payments', 'payments.transaction_id', '=', 'transactions.id')
                ->whereRaw('COALESCE(payments.paid_at, transactions.created_at) <= ?', [$cutoff])
                ->sum('transactions.amount_base');
        }

        // Channels outside the contract table, and rows with no channel at all:
        // settlement 0, buffer still applies.
        $known = array_merge(...array_values(self::channelCodesBySettlementDays()));
        $cutoff = now()->subDays($buffer);

        $total += (int) self::paidSales($userId)
            ->leftJoin('payment_channels', 'payment_channels.id', '=', 'transactions.payment_channel_id')
            ->where(function (Builder $q) use ($known) {
                $q->whereNull('transactions.payment_channel_id')
                    ->orWhereNotIn('payment_channels.channel_code', $known);
            })
            ->leftJoin('payments', 'payments.transaction_id', '=', 'transactions.id')
            ->whereRaw('COALESCE(payments.paid_at, transactions.created_at) <= ?', [$cutoff])
            ->sum('transactions.amount_base');

        return $total;
    }

    /** Earned but still inside the holding period — shown to the merchant as "Saldo Tertahan". */
    public static function heldSalesTotal(int $userId): int
    {
        return self::salesTotal($userId) - self::settledSalesTotal($userId);
    }

    /** @return Builder<Transaction> */
    private static function paidSales(int $userId): Builder
    {
        return Transaction::query()
            ->where('transactions.merchant_id', $userId)
            ->whereIn('transactions.status', TransactionStatus::paidStates());
    }

    /**
     * Contract channel codes grouped by settlement days (null → 0), so the
     * settled-sum runs one query per distinct T+n instead of one per channel.
     *
     * @return array<int, list<string>>
     */
    private static function channelCodesBySettlementDays(): array
    {
        $groups = [];

        foreach (MonetapayContractFees::CONTRACT as $code => $row) {
            $groups[$row['settlement_days'] ?? 0][] = $code;
        }

        return $groups;
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

    /** What the merchant can withdraw right now: settled sales minus non-refunded withdrawals. */
    public static function available(int $userId): int
    {
        return self::settledSalesTotal($userId) - self::withdrawnHold($userId);
    }
}
