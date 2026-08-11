<?php

namespace App\Http\Controllers\Api\Finance;

use App\Actions\Withdrawal\ApproveWithdrawalAction;
use App\Actions\Withdrawal\RejectWithdrawalAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Withdrawal\ApproveWithdrawalRequest;
use App\Http\Resources\Withdrawal\WithdrawalResource;
use App\Models\Withdrawal;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * Kita's withdrawal queue: review, approve (manual transfer or Monetapay
 * disbursement) and reject requests from any merchant.
 */
class FinanceWithdrawalController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $withdrawals = Withdrawal::query()
            ->with('merchant:id,name,email')
            ->when($request->query('status'), fn (Builder $q, $s) => $q->where('status', $s))
            ->when($request->query('merchant_id'), fn (Builder $q, $id) => $q->where('merchant_id', $id))
            ->latest('id')
            ->paginate(min(100, max(1, (int) $request->query('per_page', 20))));

        return $this->paginatedResponse(
            WithdrawalResource::collection($withdrawals),
            'Withdrawals retrieved successfully'
        );
    }

    public function approve(ApproveWithdrawalRequest $request, Withdrawal $withdrawal, ApproveWithdrawalAction $action)
    {
        $method = $request->method();

        // Store the bukti transfer (transfer receipt) on the public disk, same
        // pattern as banner images. Only a manual payout carries one.
        $proofPath = $request->hasFile('proof')
            ? $request->file('proof')->store('withdrawals/proofs', 'public')
            : null;

        try {
            $updated = $action->execute($withdrawal, $request->user(), $method, $proofPath);
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(
            new WithdrawalResource($updated),
            'Penarikan disetujui'
        );
    }

    public function reject(Request $request, Withdrawal $withdrawal, RejectWithdrawalAction $action)
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $updated = $action->execute($withdrawal, $request->user(), $validated['reason'] ?? null);
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(
            new WithdrawalResource($updated),
            'Penarikan ditolak, dana dikembalikan'
        );
    }
}
