<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

/**
 * Every transaction, full financial breakdown — kita sees the split the
 * merchant projection deliberately hides (markup, gateway fee, margin).
 */
class FinanceTransactionController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 20)));

        $transactions = Transaction::query()
            ->with([
                'product:id,name',
                'merchant:id,name,email',
                'payment:id,transaction_id,gateway_fee',
                'paymentChannel:id,name,channel_code,payment_type',
            ])
            ->when($request->query('merchant_id'), fn (Builder $q, $id) => $q->where('merchant_id', $id))
            ->when($request->query('status'), fn (Builder $q, $s) => $q->where('status', $s))
            ->when($request->query('search'), function (Builder $q, $term) {
                $like = '%'.str_replace('%', '\%', $term).'%';
                $q->where('invoice_number', 'like', $like);
            })
            ->latest('id')
            ->paginate($perPage)
            ->through(fn (Transaction $t) => [
                'id' => $t->id,
                'invoice_number' => $t->invoice_number,
                'product' => $t->product?->name,
                'merchant' => $t->merchant ? ['id' => $t->merchant->id, 'name' => $t->merchant->name] : null,
                'amount_base' => (int) $t->amount_base,
                'amount_fee' => (int) $t->amount_fee,
                'amount_total' => (int) $t->amount_total,
                'gateway_fee' => (int) ($t->payment?->gateway_fee ?? 0),
                'platform_profit' => (int) $t->amount_fee - (int) ($t->payment?->gateway_fee ?? 0),
                'margin' => (int) $t->margin,
                'status' => $t->status?->value,
                'payment_channel' => $t->paymentChannel?->name,
                'created_at' => $t->created_at?->toIso8601String(),
            ]);

        return $this->successResponse($transactions, 'Transactions retrieved successfully');
    }
}
