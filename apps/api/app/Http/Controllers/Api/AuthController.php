<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Actions\Auth\GoogleLoginAction;
use App\Actions\Auth\LoginAction;
use App\Actions\Auth\LogoutAction;
use App\Actions\Auth\RefreshTokenAction;
use App\Actions\Auth\RegisterAction;
use App\Actions\Auth\ResetPasswordAction;
use App\Actions\Auth\SendPasswordResetLinkAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\GoogleLoginRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RefreshTokenRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
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
        return $this->sessionResponse($action->execute($request->toDTO()));
    }

    /**
     * Handle "Sign in with Google" — verifies the ID token and signs the user
     * in, creating a MEMBER account on first use.
     */
    public function google(GoogleLoginRequest $request, GoogleLoginAction $action): JsonResponse
    {
        return $this->sessionResponse($action->execute($request->toDTO()));
    }

    /**
     * Shape whatever `IssueSessionAction` returned.
     *
     * When a second factor is owed the body carries the challenge and nothing
     * else — no user, no email, no role. Returning the account here would hand
     * anyone working through a leaked password list a free enumeration and
     * role-disclosure oracle.
     *
     * @param  array<string, mixed>  $result
     */
    private function sessionResponse(array $result): JsonResponse
    {
        if (isset($result['two_factor_required'])) {
            return $this->successResponse([
                'two_factor_required' => true,
                'challenge_token' => $result['challenge_token'],
            ], 'Masukkan kode dari aplikasi authenticator kamu');
        }

        return $this->successResponse([
            'user' => new UserResource($result['user']),
            'access_token' => $result['access_token'],
            'refresh_token' => $result['refresh_token'],
        ], 'Login successful');
    }

    /**
     * Handle self-service registration.
     */
    public function register(RegisterRequest $request, RegisterAction $action): JsonResponse
    {
        $result = $action->execute($request->toDTO());

        return $this->successResponse([
            'user' => new UserResource($result['user']),
            'access_token' => $result['access_token'],
            'refresh_token' => $result['refresh_token'],
        ], 'Registration successful', 201);
    }

    /**
     * Email a password reset link.
     *
     * Always reports success — see SendPasswordResetLinkAction for why.
     */
    public function forgotPassword(ForgotPasswordRequest $request, SendPasswordResetLinkAction $action): JsonResponse
    {
        $action->execute($request->validated('email'));

        return $this->successResponse(null, 'Jika email terdaftar, tautan reset password telah dikirim.');
    }

    /**
     * Complete a password reset from an emailed token.
     */
    public function resetPassword(ResetPasswordRequest $request, ResetPasswordAction $action): JsonResponse
    {
        $action->execute($request->credentials());

        return $this->successResponse(null, 'Password berhasil diperbarui');
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
