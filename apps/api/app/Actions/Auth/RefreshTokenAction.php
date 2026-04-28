<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\DTOs\Auth\RefreshTokenDTO;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class RefreshTokenAction
{
    /**
     * Execute the refresh token action.
     *
     * @return array{access_token: string, refresh_token: string}
     * @throws ValidationException
     */
    public function execute(RefreshTokenDTO $dto): array
    {
        $token = PersonalAccessToken::findToken($dto->refreshToken);

        if (!$token || !$token->can('issue-access-token') || $token->expires_at?->isPast()) {
            throw ValidationException::withMessages([
                'refresh_token' => ['Invalid or expired refresh token.'],
            ]);
        }

        /** @var \App\Models\User $user */
        $user = $token->tokenable;

        // Revoke the old refresh token
        $token->delete();

        // Issue New Access Token (valid for 60 mins)
        $newAccessToken = $user->createToken('access_token', ['access-api'], now()->addMinutes(60))->plainTextToken;

        // Issue New Refresh Token (valid for 30 days)
        $newRefreshToken = $user->createToken('refresh_token', ['issue-access-token'], now()->addDays(30))->plainTextToken;

        return [
            'access_token'  => $newAccessToken,
            'refresh_token' => $newRefreshToken,
        ];
    }
}
