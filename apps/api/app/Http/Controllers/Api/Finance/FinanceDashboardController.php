<?php

namespace App\Http\Controllers\Api\Finance;

use App\Enums\WithdrawalStatus;
use App\Http\Controllers\Controller;
use App\Models\PlatformAccount;
use App\Models\Withdrawal;
use App\Support\Finance\FinanceTotals;
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
            // Kita's profit balance = accumulated (admin_fee - gateway_fee - tax).
            'saldo' => (int) ($account?->balance ?? 0),
            // The headline volumes, from the ONE definition the Hub's summary
            // pull reads as well (see FinanceTotals). Shared rather than restated
            // here so the panel and the Hub cannot drift apart — and paid-only,
            // so pending or failed rows cannot overstate a volume.
            ...FinanceTotals::snapshot(),
            'pending_withdrawals' => (int) Withdrawal::where('status', WithdrawalStatus::PENDING)->count(),
            'pending_withdrawals_amount' => (int) Withdrawal::where('status', WithdrawalStatus::PENDING)->sum('amount'),
        ], 'Dashboard retrieved successfully');
    }
}
