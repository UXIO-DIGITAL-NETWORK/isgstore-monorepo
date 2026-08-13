<?php

namespace App\Http\Controllers\Api\Merchant;

use App\Enums\SubscriptionStatus;
use App\Enums\WithdrawalStatus;
use App\Http\Controllers\Controller;
use App\Models\ServiceSubscription;
use App\Models\Transaction;
use App\Models\Withdrawal;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

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

        // Feeds the "Website Services" card. Returned here rather than from a
        // second endpoint so the card has its date on first paint.
        $activeSubscriptions = ServiceSubscription::query()
            ->where('merchant_id', $user->id)
            ->where('status', SubscriptionStatus::ACTIVE)
            ->where('ends_at', '>', now());

        $nearestExpiry = (clone $activeSubscriptions)->min('ends_at');
        $activeServices = (clone $activeSubscriptions)->distinct('service_id')->count('service_id');

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
            // The nearest expiry — the date the client actually needs to act
            // on. Null when nothing is subscribed, so the card hides the line
            // rather than inventing a date.
            'service_active_until' => $nearestExpiry ? Carbon::parse($nearestExpiry)->toIso8601String() : null,
            'active_services_count' => (int) $activeServices,
        ], 'Dashboard retrieved successfully');
    }
}
