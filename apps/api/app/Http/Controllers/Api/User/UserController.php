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
use App\Http\Controllers\Controller;
use App\Http\Requests\User\AdjustUserBalanceRequest;
use App\Http\Requests\User\IndexUserRequest; // Import Action baru
use App\Http\Requests\User\SetUserStatusRequest;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\User\UserResource;
use App\Models\User;
use App\Traits\ApiResponse;

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
}
