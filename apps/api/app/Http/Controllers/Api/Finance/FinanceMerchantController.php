<?php

namespace App\Http\Controllers\Api\Finance;

use App\Enums\RoleType;
use App\Enums\WithdrawalStatus;
use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Withdrawal;
use App\Support\Wallet\MerchantBalance;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

/**
 * Every merchant ("client") and their balances — kita's roster view.
 */
class FinanceMerchantController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 20)));

        $merchants = User::query()
            ->whereHas('role', fn (Builder $q) => $q->whereRaw('LOWER(name) = ?', [RoleType::PAYMENT_ADMIN->value]))
            ->when($request->query('search'), function (Builder $q, $term) {
                $like = '%'.str_replace('%', '\%', $term).'%';
                $q->where(fn (Builder $w) => $w->where('name', 'like', $like)->orWhere('email', 'like', $like));
            })
            ->latest('id')
            ->paginate($perPage)
            ->through(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'phone' => $u->phone,
                'status' => $u->status ?? 'active',
                'balance' => MerchantBalance::available($u->id),
                'created_at' => $u->created_at?->toIso8601String(),
            ]);

        return $this->successResponse($merchants, 'Merchants retrieved successfully');
    }

    public function show(User $user)
    {
        return $this->successResponse([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->status ?? 'active',
            'balance' => MerchantBalance::available($user->id),
            'total_penjualan' => (int) Transaction::where('merchant_id', $user->id)->sum('amount_base'),
            'total_transaksi' => (int) Transaction::where('merchant_id', $user->id)->count(),
            'total_penarikan' => (int) Withdrawal::where('merchant_id', $user->id)
                ->where('status', WithdrawalStatus::SETTLED)
                ->sum('nett'),
            'created_at' => $user->created_at?->toIso8601String(),
        ], 'Merchant retrieved successfully');
    }
}
