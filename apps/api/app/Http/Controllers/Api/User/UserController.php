<?php

namespace App\Http\Controllers\Api\User;

use App\Actions\User\AdjustUserBalanceAction;
use App\Actions\User\CreateUserAction;
use App\Actions\User\DeleteUserAction;
use App\Actions\User\GetUsersAction; // Import FormRequest baru
use App\Actions\User\SetUserStatusAction;
use App\Actions\User\UpdateUserAction;
use App\DTOs\User\UserDTO;
use App\DTOs\User\UserFilterDTO; // Import DTO baru
use App\Enums\TransactionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\AdjustUserBalanceRequest;
use App\Http\Requests\User\IndexUserRequest; // Import Action baru
use App\Http\Requests\User\SetUserStatusRequest;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\User\UserResource;
use App\Models\BalanceMutation;
use App\Models\BalanceTopup;
use App\Models\MembershipSubscription;
use App\Models\PointLedgerEntry;
use App\Models\RefundRequest;
use App\Models\Transaction;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class UserController extends Controller
{
    use ApiResponse;

    public function index(IndexUserRequest $request, GetUsersAction $action)
    {
        $dto = UserFilterDTO::fromValidated($request->validated());
        $users = $action->execute($dto);

        return $this->paginatedResponse(UserResource::collection($users), 'Data user berhasil diambil');
    }

    public function store(StoreUserRequest $request, CreateUserAction $action)
    {
        $dto = UserDTO::fromValidated($request->validated());
        $user = $action->execute($dto);

        return $this->successResponse(new UserResource($user), 'User berhasil dibuat', 201);
    }

    public function show(User $user)
    {
        return $this->successResponse(new UserResource($user), 'Detail user berhasil diambil');
    }

    public function update(UpdateUserRequest $request, User $user, UpdateUserAction $action)
    {
        // Gabungkan data lama dengan data tervalidasi baru untuk DTO
        $data = array_merge($user->toArray(), $request->validated());
        $dto = UserDTO::fromValidated($data);

        $updatedUser = $action->execute($user, $dto);

        return $this->successResponse(new UserResource($updatedUser), 'User berhasil diperbarui');
    }

    public function destroy(User $user, DeleteUserAction $action)
    {
        $action->execute($user);

        return $this->successResponse(null, 'User berhasil dihapus');
    }

    public function setStatus(SetUserStatusRequest $request, User $user, SetUserStatusAction $action)
    {
        $user = $action->execute($user, $request->validated('status'));

        return $this->successResponse(new UserResource($user), 'Status user berhasil diperbarui');
    }

    public function adjustBalance(AdjustUserBalanceRequest $request, User $user, AdjustUserBalanceAction $action)
    {
        $user = $action->execute(
            $user,
            (int) $request->validated('amount'),
            $request->validated('direction'),
            $request->validated('reason'),
        );

        return $this->successResponse(new UserResource($user), 'Saldo user berhasil disesuaikan');
    }

    /**
     * The whole picture of one account, for the admin user-detail page.
     *
     * The profile already exists on the list; what a detail page needs on top is
     * the aggregates and the threads an operator follows from here — orders,
     * wallet, points, refunds, membership. Answered in one round trip so the
     * summary renders together instead of in five staggered pieces.
     *
     * Read-only and additive: nothing here writes, and every count is scoped to
     * THIS account.
     */
    public function overview(User $user)
    {
        $user->loadMissing('role');

        $transactions = Transaction::query()->where('user_id', $user->id);

        $membership = MembershipSubscription::query()
            ->where('user_id', $user->id)
            ->currentlyActive()
            ->with('membershipPlan:id,name')
            ->latest('id')
            ->first();

        return $this->successResponse([
            'user' => new UserResource($user),
            'stats' => [
                'transactions_count' => (clone $transactions)->count(),
                // Only settled money reads as spend. A PENDING order has not
                // been paid for, and counting it would overstate the account.
                'total_spent' => (int) (clone $transactions)
                    ->whereIn('status', TransactionStatus::paidStates())
                    ->sum('amount_total'),
                'refunds_count' => $this->refundsFor($user->id)->count(),
                'topups_count' => BalanceTopup::query()->where('user_id', $user->id)->count(),
            ],
            'membership' => $membership === null ? null : [
                // `name` is locale-keyed JSON — never the raw array.
                'plan' => $membership->membershipPlan?->localizedName(app()->getLocale()),
                'status' => $membership->status,
                'starts_at' => $membership->starts_at?->toIso8601String(),
                'ends_at' => $membership->ends_at?->toIso8601String(),
                // NULL ends_at is the lifetime sentinel — see the model.
                'lifetime' => $membership->isLifetime(),
            ],
        ], 'Data ringkasan user berhasil diambil');
    }

    /** One account's wallet ledger, newest first. */
    public function balanceMutations(Request $request, User $user)
    {
        $rows = BalanceMutation::query()
            ->where('user_id', $user->id)
            ->latest('id')
            ->paginate($this->perPage($request));

        $rows->through(fn (BalanceMutation $row) => [
            'id' => $row->id,
            'type' => $row->type,
            'amount' => (int) $row->amount,
            'balance_before' => (int) $row->balance_before,
            'balance_after' => (int) $row->balance_after,
            'reference' => $row->reference,
            'description' => $row->description,
            'created_at' => $row->created_at,
        ]);

        return $this->successResponse($rows, 'Mutasi saldo user berhasil diambil');
    }

    /** One account's point statement, newest first. */
    public function pointHistory(Request $request, User $user)
    {
        $rows = PointLedgerEntry::query()
            ->where('user_id', $user->id)
            ->latest('id')
            ->paginate($this->perPage($request));

        $rows->through(fn (PointLedgerEntry $row) => [
            'id' => $row->id,
            'type' => $row->type,
            'amount' => (int) $row->amount,
            'points_before' => (int) $row->points_before,
            'points_after' => (int) $row->points_after,
            'reference' => $row->reference,
            'description' => $row->description,
            'created_at' => $row->created_at,
        ]);

        return $this->successResponse($rows, 'Riwayat poin user berhasil diambil');
    }

    /** Refunds tied to one account, either as the buyer or as the claimant. */
    public function refunds(Request $request, User $user)
    {
        $rows = $this->refundsFor($user->id)
            ->with('transaction:id,invoice_number')
            ->latest('id')
            ->paginate($this->perPage($request));

        $rows->through(fn (RefundRequest $row) => [
            'id' => $row->id,
            'refund_number' => $row->refund_number,
            'invoice_number' => $row->transaction?->invoice_number,
            'amount' => (int) $row->amount,
            'status' => $row->status?->value,
            'method' => $row->method?->value,
            'created_at' => $row->created_at,
            'refunded_at' => $row->refunded_at,
        ]);

        return $this->successResponse($rows, 'Refund user berhasil diambil');
    }

    /**
     * A refund belongs to an account as the buyer OR as the claimant: a guest
     * claim never rewrites `transactions.user_id`, so the claim is the only
     * thread back to the person who was refunded.
     */
    private function refundsFor(int $userId): Builder
    {
        return RefundRequest::query()
            ->where(fn (Builder $q) => $q->where('user_id', $userId)->orWhere('claimed_user_id', $userId));
    }

    private function perPage(Request $request): int
    {
        return min(100, max(1, (int) $request->query('per_page', 20)));
    }
}
