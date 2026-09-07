<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Member;

use App\Actions\Member\ChangePasswordAction;
use App\Actions\Member\UpdateProfileAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Member\ChangePasswordRequest;
use App\Http\Requests\Member\UpdateProfileRequest;
use App\Http\Resources\User\UserResource;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    use ApiResponse;

    public function show(Request $request): JsonResponse
    {
        return $this->successResponse(
            new UserResource($request->user()->load('role')),
            'Profile retrieved successfully'
        );
    }

    public function update(UpdateProfileRequest $request, UpdateProfileAction $action): JsonResponse
    {
        return $this->successResponse(
            new UserResource($action->execute($request->user(), $request->toDTO())),
            'Profil berhasil diperbarui'
        );
    }

    public function updatePassword(ChangePasswordRequest $request, ChangePasswordAction $action): JsonResponse
    {
        $action->execute(
            $request->user(),
            $request->validated('current_password'),
            $request->validated('password'),
        );

        return $this->successResponse(null, 'Password berhasil diperbarui');
    }
}
