<?php

namespace App\Http\Controllers\Api\Member;

use App\Actions\Wallet\CreateBalanceTopupAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Wallet\StoreTopupRequest;
use App\Models\BalanceMutation;
use App\Models\BalanceTopup;
use App\Traits\ApiResponse;
use Exception;
use Illuminate\Http\Request;

class BalanceTopupController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $topups = BalanceTopup::with('paymentChannel')
            // Scoped to the caller before any filter, so no combination of
            // parameters can widen it to another member's rows.
            ->where('user_id', $request->user()->id)
            ->latest('id')
            ->paginate(min(50, max(1, (int) $request->query('per_page', 10))));

        $topups->through(fn (BalanceTopup $topup) => [
            'reference_id' => $topup->reference_id,
            'amount' => (int) $topup->amount,
            'admin_fee' => (int) $topup->admin_fee,
            'total' => (int) $topup->total,
            'status' => $topup->status,
            'payment_channel' => $topup->paymentChannel?->name,
            'paid_at' => $topup->paid_at,
            'created_at' => $topup->created_at,
        ]);

        return $this->successResponse($topups, 'Top-ups retrieved successfully');
    }

    public function store(StoreTopupRequest $request, CreateBalanceTopupAction $action)
    {
        try {
            return $this->successResponse($action->execute($request->toDTO()), 'Isi saldo berhasil dibuat', 201);
        } catch (Exception $e) {
            // Business failures come back as 400 with a readable Indonesian
            // message, matching how checkout reports the same class of problem.
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    public function show(Request $request, string $reference)
    {
        $topup = BalanceTopup::with('paymentChannel')
            ->where('user_id', $request->user()->id)
            ->where('reference_id', $reference)
            ->first();

        if (! $topup) {
            return $this->errorResponse('Top-up not found', 404);
        }

        return $this->successResponse([
            'reference_id' => $topup->reference_id,
            'amount' => (int) $topup->amount,
            'admin_fee' => (int) $topup->admin_fee,
            'total' => (int) $topup->total,
            'status' => $topup->status,
            'is_terminal' => $topup->status !== 'PENDING',
            'payment' => [
                'channel' => $topup->paymentChannel?->name,
                'channel_code' => $topup->paymentChannel?->channel_code,
                'type' => $topup->paymentChannel?->payment_type,
                'instructions' => $topup->payment_data,
            ],
            'paid_at' => $topup->paid_at,
            'created_at' => $topup->created_at,
        ], 'Top-up retrieved successfully');
    }

    /** The wallet ledger — every movement, with its running balance. */
    public function mutations(Request $request)
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
            'created_at' => $row->created_at,
        ]);

        return $this->successResponse($mutations, 'Balance mutations retrieved successfully');
    }
}
