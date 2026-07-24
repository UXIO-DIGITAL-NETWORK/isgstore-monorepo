<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Actions\Auth\LoginAction;
use App\Actions\Auth\LogoutAction;
use App\Actions\Auth\RefreshTokenAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RefreshTokenRequest;
use App\Http\Resources\User\UserResource;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    use ApiResponse;

    /**
     * Handle the login request.
     */
    public function login(LoginRequest $request, LoginAction $action): JsonResponse
    {
        $result = $action->execute($request->toDTO());

        return $this->successResponse([
            'user' => new UserResource($result['user']),
            'access_token' => $result['access_token'],
            'refresh_token' => $result['refresh_token'],
        ], 'Login successful');
    }

    /**
     * Handle the refresh token request.
     */
    public function refreshToken(RefreshTokenRequest $request, RefreshTokenAction $action): JsonResponse
    {
        $result = $action->execute($request->toDTO());

        return $this->successResponse([
            'access_token' => $result['access_token'],
            'refresh_token' => $result['refresh_token'],
        ], 'Token refreshed successfully');
    }

    /**
     * Handle the logout request.
     */
    public function logout(LogoutAction $action): JsonResponse
    {
        $action->execute();

        return $this->successResponse(null, 'Logged out successfully');
    }
}
