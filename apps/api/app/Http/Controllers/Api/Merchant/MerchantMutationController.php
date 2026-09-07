<?php

namespace App\Http\Controllers\Api\Merchant;

use App\Http\Controllers\Controller;
use App\Models\BalanceMutation;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

/**
 * The merchant's wallet ledger ("Mutasi") — every movement with its running
 * balance: settlements in, withdrawals out, refunds. Scoped to the caller.
 */
class MerchantMutationController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $mutations = BalanceMutation::where('user_id', $request->user()->id)
            ->latest('id')
            ->paginate(min(100, max(1, (int) $request->query('per_page', 20))));

        $mutations->through(fn (BalanceMutation $row) => [
            'id' => $row->id,
            'type' => $row->type,
            'amount' => (int) $row->amount,
            'balance_before' => (int) $row->balance_before,
            'balance_after' => (int) $row->balance_after,
            'reference' => $row->reference,
            'description' => $row->description,
            'created_at' => $row->created_at?->toIso8601String(),
        ]);

        return $this->successResponse($mutations, 'Mutations retrieved successfully');
    }
}
