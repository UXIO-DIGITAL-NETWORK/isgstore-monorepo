<?php

namespace App\Http\Controllers\Api\Merchant;

use App\Enums\WithdrawalStatus;
use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Withdrawal;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

/**
 * The merchant's ("client") overview: current balance plus lifetime sales and
 * withdrawal totals. Everything is scoped to the caller.
 */
class MerchantDashboardController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $user = $request->user();

        $pendingWithdrawal = (int) Withdrawal::where('merchant_id', $user->id)
            ->whereIn('status', [WithdrawalStatus::PENDING, WithdrawalStatus::APPROVED, WithdrawalStatus::PROCESSING])
            ->sum('amount');

        return $this->successResponse([
            // The held funds are already debited from balance, so `saldo_aktif`
            // is what the merchant can still withdraw right now.
            'saldo_aktif' => (int) $user->balance,
            'saldo_pending' => $pendingWithdrawal,
            'total_penjualan' => (int) Transaction::where('merchant_id', $user->id)->sum('amount_base'),
            'total_penarikan' => (int) Withdrawal::where('merchant_id', $user->id)
                ->where('status', WithdrawalStatus::SETTLED)
                ->sum('nett'),
            'total_transaksi' => (int) Transaction::where('merchant_id', $user->id)->count(),
        ], 'Dashboard retrieved successfully');
    }
}
