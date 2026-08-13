<?php

namespace App\Http\Controllers\Api\Finance;

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

        return $this->successResponse([
            // Kita's profit balance = accumulated (admin_fee - gateway_fee).
            'saldo' => (int) ($account?->balance ?? 0),
            'total_admin_fee' => (int) Transaction::whereNotNull('merchant_id')->sum('amount_fee'),
            'total_gateway_fee' => (int) Payment::sum('gateway_fee'),
            'total_settled_to_merchants' => (int) Transaction::whereNotNull('merchant_id')->sum('amount_base'),
            'pending_withdrawals' => (int) Withdrawal::where('status', WithdrawalStatus::PENDING)->count(),
            'pending_withdrawals_amount' => (int) Withdrawal::where('status', WithdrawalStatus::PENDING)->sum('amount'),
        ], 'Dashboard retrieved successfully');
    }
}
