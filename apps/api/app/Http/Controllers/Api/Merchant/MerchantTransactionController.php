<?php

namespace App\Http\Controllers\Api\Merchant;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

/**
 * The merchant's sales — transactions attributed to them via `merchant_id`.
 *
 * The projection is deliberately narrow (field-by-field, mirroring the member
 * order list): the client sees its own net sale price, never the platform's
 * markup, the gateway fee, or supplier ids.
 */
class MerchantTransactionController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 20)));

        $transactions = Transaction::query()
            ->where('merchant_id', $request->user()->id)
            ->with([
                'product:id,name',
                'paymentChannel:id,name,channel_code,payment_type',
            ])
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
                // The client's net sale price — what settles to their balance.
                'nett' => (int) $t->amount_base,
                'status' => $t->status?->value,
                'payment_channel' => $t->paymentChannel?->name,
                'created_at' => $t->created_at?->toIso8601String(),
            ]);

        return $this->successResponse($transactions, 'Transactions retrieved successfully');
    }
}
