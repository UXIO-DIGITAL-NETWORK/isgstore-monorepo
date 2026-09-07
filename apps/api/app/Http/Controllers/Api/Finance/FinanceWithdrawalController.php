<?php

namespace App\Http\Controllers\Api\Finance;

use App\Actions\Withdrawal\ApproveWithdrawalAction;
use App\Actions\Withdrawal\CreateInternalWithdrawalRequestAction;
use App\Actions\Withdrawal\RejectWithdrawalAction;
use App\DTOs\Withdrawal\CreateInternalWithdrawalDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Withdrawal\ApproveWithdrawalRequest;
use App\Http\Requests\Withdrawal\StoreInternalWithdrawalRequest;
use App\Http\Resources\Withdrawal\WithdrawalResource;
use App\Models\Withdrawal;
use App\Support\Wallet\PlatformBalance;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * Kita's withdrawal queue: review, approve (manual transfer or Monetapay
 * disbursement) and reject requests — from a merchant, or self-initiated
 * ("penarikan internal", `merchant_id` null, `requested_by` set instead).
 */
class FinanceWithdrawalController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        // `type` tells merchant-initiated rows apart from internal ones.
        // Default 'merchant' so the existing "Verifikasi Penarikan" list keeps
        // its exact current behaviour without needing a frontend change.
        $type = $request->query('type', 'merchant');

        $withdrawals = Withdrawal::query()
            ->with(['merchant:id,name,email', 'requester:id,name,email'])
            ->when($type === 'merchant', fn (Builder $q) => $q->whereNotNull('merchant_id'))
            ->when($type === 'internal', fn (Builder $q) => $q->whereNull('merchant_id'))
            ->when($request->query('status'), fn (Builder $q, $s) => $q->where('status', $s))
            ->when($request->query('merchant_id'), fn (Builder $q, $id) => $q->where('merchant_id', $id))
            ->latest('id')
            ->paginate(min(100, max(1, (int) $request->query('per_page', 20))));

        return $this->paginatedResponse(
            WithdrawalResource::collection($withdrawals),
            'Withdrawals retrieved successfully'
        );
    }

    public function store(StoreInternalWithdrawalRequest $request, CreateInternalWithdrawalRequestAction $action)
    {
        try {
            $withdrawal = $action->execute(
                CreateInternalWithdrawalDTO::fromValidated($request->validated(), $request->user()->id)
            );
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(
            new WithdrawalResource($withdrawal),
            'Permintaan penarikan internal berhasil dibuat',
            201
        );
    }

    public function platformBalance()
    {
        return $this->successResponse(
            ['available' => PlatformBalance::available()],
            'Platform balance retrieved successfully'
        );
    }

    public function approve(ApproveWithdrawalRequest $request, Withdrawal $withdrawal, ApproveWithdrawalAction $action)
    {
        $method = $request->method();

        // Store the bukti transfer (transfer receipt) on the public disk. Only
        // a manual payout carries one.
        //
        // Payment proof is evidence: stored byte-for-byte, never re-encoded.
        // See App\Services\ImageOptimizer — do not route this through it.
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
