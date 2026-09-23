<?php

declare(strict_types=1);

namespace App\Support\Finance;

use App\Enums\TransactionStatus;
use App\Models\Payment;
use App\Models\Transaction;

/**
 * The headline finance figures the payment-internal dashboard and the Hub's
 * summary pull both render.
 *
 * One definition on purpose: the Hub must never disagree with the site panel
 * about the same number. It used to be the same queries written out twice —
 * which is drift waiting to happen the moment one side is touched.
 *
 * It also has to be CHEAP, because the two callers could not be more different
 * in cadence: a human opens the dashboard, while the Hub pulls its summary
 * every minute, forever. The original shape was six separate full-history
 * aggregates over `transactions`/`payments`, two of them written as
 * `Payment::whereIn('transaction_id', $paid->select('id'))` — an IN list of
 * every paid transaction ever, which MySQL materialises before probing
 * `payments`, twice. That is what grew past the Hub's 15s pull timeout and
 * surfaced as `cURL error 28 ... 0 bytes received`. The same six figures now
 * come from three queries with no materialised id list.
 */
final class FinanceTotals
{
    /**
     * @return array{
     *     total_admin_fee: int,
     *     total_gateway_fee: int,
     *     total_tax: int,
     *     total_settled_to_merchants: int,
     *     total_transactions_count: int,
     *     total_transactions_amount: int,
     * }
     */
    public static function snapshot(): array
    {
        // Only paid transactions represent money actually collected — the
        // ledger-backed saldo settles at PAID, so pending/failed rows would
        // overstate. One aggregate returns both transaction-side sums.
        $transactions = Transaction::query()
            ->whereNotNull('merchant_id')
            ->whereIn('status', TransactionStatus::paidStates())
            ->selectRaw('COALESCE(SUM(amount_fee), 0) as admin_fee')
            ->selectRaw('COALESCE(SUM(amount_base), 0) as settled')
            ->first();

        // A JOIN, not `whereIn('transaction_id', $paid->select('id'))`: the join
        // reads the very same payment rows through the `transaction_id` index
        // instead of first materialising every paid transaction id.
        $fees = Payment::query()
            ->join('transactions', 'transactions.id', '=', 'payments.transaction_id')
            ->whereNotNull('transactions.merchant_id')
            ->whereIn('transactions.status', TransactionStatus::paidStates())
            ->selectRaw('COALESCE(SUM(payments.gateway_fee), 0) as gateway_fee')
            ->selectRaw('COALESCE(SUM(payments.tax_amount), 0) as tax')
            ->first();

        $settled = (int) ($transactions->settled ?? 0);

        return [
            'total_admin_fee' => (int) ($transactions->admin_fee ?? 0),
            'total_gateway_fee' => (int) ($fees->gateway_fee ?? 0),
            'total_tax' => (int) ($fees->tax ?? 0),
            'total_settled_to_merchants' => $settled,
            // Headline volume across every merchant: how many rows there are,
            // and the paid nominal (amount_base) they represent. The count is
            // deliberately NOT filtered by status — it is the total book of
            // merchant transactions, which is how the dashboard has always read
            // it and how the Hub's card is labelled.
            'total_transactions_count' => (int) Transaction::query()
                ->whereNotNull('merchant_id')
                ->count(),
            'total_transactions_amount' => $settled,
        ];
    }
}
