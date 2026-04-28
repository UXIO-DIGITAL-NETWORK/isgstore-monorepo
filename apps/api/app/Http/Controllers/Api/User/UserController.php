<?php

namespace App\Http\Controllers\Api\User;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Http\Requests\User\IndexUserRequest; // Import FormRequest baru
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\DTOs\User\UserFilterDTO; // Import DTO baru
use App\DTOs\User\UserDTO;
use App\Actions\User\GetUsersAction; // Import Action baru
use App\Actions\User\CreateUserAction;
use App\Actions\User\UpdateUserAction;
use App\Actions\User\DeleteUserAction;
use App\Http\Resources\User\UserResource;
use App\Traits\ApiResponse;

class UserController extends Controller
{
    use ApiResponse;
    public function index(IndexUserRequest $request, GetUsersAction $action)
    {
        $dto = UserFilterDTO::fromValidated($request->validated());
        $users = $action->execute($dto);

        return $this->successResponse(
            UserResource::collection($users)->response()->getData(true),
            'Data user berhasil diambil'
        );
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
}
