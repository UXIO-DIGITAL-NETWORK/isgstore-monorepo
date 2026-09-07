<?php

namespace App\Http\Controllers\Api\Finance;

use App\Enums\TransactionStatus;
use App\Enums\WithdrawalStatus;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\PlatformAccount;
use App\Models\Transaction;
use App\Models\Withdrawal;
use App\Support\Ledger\PlatformLedger;
use App\Traits\ApiResponse;

/**
 * Kita's overview: the platform's own saldo (accumulated markup) plus the
 * headline volumes across every merchant.
 */
class FinanceDashboardController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $account = PlatformAccount::where('code', PlatformLedger::DEFAULT_ACCOUNT)->first();

        // Only paid transactions represent money actually collected, matching
        // the ledger-backed `saldo` that settles at PAID. Counting pending or
        // failed rows here would overstate every headline volume.
        $paid = Transaction::whereNotNull('merchant_id')
            ->whereIn('status', TransactionStatus::paidStates());

        return $this->successResponse([
            // Kita's profit balance = accumulated (admin_fee - gateway_fee - tax).
            'saldo' => (int) ($account?->balance ?? 0),
            'total_admin_fee' => (int) $paid->clone()->sum('amount_fee'),
            'total_gateway_fee' => (int) Payment::whereIn(
                'transaction_id', $paid->clone()->select('id')
            )->sum('gateway_fee'),
            // Total PPN levied on the admin fee across paid transactions.
            'total_tax' => (int) Payment::whereIn(
                'transaction_id', $paid->clone()->select('id')
            )->sum('tax_amount'),
            'total_settled_to_merchants' => (int) $paid->clone()->sum('amount_base'),
            // Headline transaction volume across every merchant: how many, and
            // the paid nominal (amount_base) they represent.
            'total_transactions_count' => (int) Transaction::whereNotNull('merchant_id')->count(),
            'total_transactions_amount' => (int) $paid->clone()->sum('amount_base'),
            'pending_withdrawals' => (int) Withdrawal::where('status', WithdrawalStatus::PENDING)->count(),
            'pending_withdrawals_amount' => (int) Withdrawal::where('status', WithdrawalStatus::PENDING)->sum('amount'),
        ], 'Dashboard retrieved successfully');
    }
}
