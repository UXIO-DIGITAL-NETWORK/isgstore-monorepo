<?php

namespace App\Http\Controllers\Api\Merchant;

use App\Actions\Withdrawal\CreateWithdrawalRequestAction;
use App\DTOs\Withdrawal\CreateWithdrawalDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Withdrawal\StoreWithdrawalRequest;
use App\Http\Resources\Withdrawal\WithdrawalResource;
use App\Models\Withdrawal;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * The merchant's ("client") own withdrawal requests. Every query is scoped to
 * the caller's id, so no merchant can see or create against another's balance.
 */
class WithdrawalController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $withdrawals = Withdrawal::where('merchant_id', $request->user()->id)
            ->latest('id')
            ->paginate(min(100, max(1, (int) $request->query('per_page', 20))));

        return $this->paginatedResponse(
            WithdrawalResource::collection($withdrawals),
            'Withdrawals retrieved successfully'
        );
    }

    public function store(StoreWithdrawalRequest $request, CreateWithdrawalRequestAction $action)
    {
        $dto = CreateWithdrawalDTO::fromValidated($request->validated(), $request->user()->id);

        try {
            $withdrawal = $action->execute($dto);
        } catch (RuntimeException $e) {
            // WalletLedger throws when the balance can't cover the hold.
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(
            new WithdrawalResource($withdrawal),
            'Permintaan penarikan berhasil dibuat',
            201
        );
    }

    public function show(Request $request, string $number)
    {
        $withdrawal = Withdrawal::where('merchant_id', $request->user()->id)
            ->where('withdrawal_number', $number)
            ->firstOrFail();

        return $this->successResponse(
            new WithdrawalResource($withdrawal),
            'Withdrawal retrieved successfully'
        );
    }
}
