<?php

namespace App\Http\Controllers\Api\Merchant;

use App\Enums\SubscriptionStatus;
use App\Enums\TransactionStatus;
use App\Enums\WithdrawalStatus;
use App\Http\Controllers\Controller;
use App\Models\ServiceSubscription;
use App\Models\Transaction;
use App\Models\Withdrawal;
use App\Support\Wallet\MerchantBalance;
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

        // Feeds the "Website Services" card. Returned here rather than from a
        // second endpoint so the card has its date on first paint.
        $activeSubscriptions = ServiceSubscription::query()
            ->where('merchant_id', $user->id)
            ->where('status', SubscriptionStatus::ACTIVE)
            ->where('ends_at', '>', now());

        $nearestExpiry = (clone $activeSubscriptions)->min('ends_at');
        $activeServices = (clone $activeSubscriptions)->distinct('service_id')->count('service_id');

        // The transaction count is an earned figure, so only paid transactions
        // count — pending/failed sales never settle.
        $paidSales = Transaction::where('merchant_id', $user->id)
            ->whereIn('status', TransactionStatus::paidStates());

        return $this->successResponse([
            // Withdrawable balance is derived live from sales minus non-refunded
            // withdrawals (MerchantBalance), not the stored users.balance column.
            'saldo_aktif' => MerchantBalance::available($user->id),
            'saldo_pending' => MerchantBalance::pending($user->id),
            'total_penjualan' => MerchantBalance::salesTotal($user->id),
            'total_penarikan' => (int) Withdrawal::where('merchant_id', $user->id)
                ->where('status', WithdrawalStatus::SETTLED)
                ->sum('nett'),
            'total_transaksi' => (int) $paidSales->clone()->count(),
            // The nearest expiry — the date the client actually needs to act
            // on. Null when nothing is subscribed, so the card hides the line
            // rather than inventing a date.
            'service_active_until' => $nearestExpiry ? Carbon::parse($nearestExpiry)->toIso8601String() : null,
            'active_services_count' => (int) $activeServices,
        ], 'Dashboard retrieved successfully');
    }
}
