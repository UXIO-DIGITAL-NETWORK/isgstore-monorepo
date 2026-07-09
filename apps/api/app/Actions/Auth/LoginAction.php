<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Auth\LoginDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class LoginAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    /**
     * Execute the login action.
     *
     * @return array{access_token: string, refresh_token: string, user: User}
     *
     * @throws ValidationException
     */
    public function execute(LoginDTO $dto): array
    {
        if (! Auth::attempt(['email' => $dto->email, 'password' => $dto->password])) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        /** @var User $user */
        $user = Auth::user();

        // Piggyback Timezone Synchronization: Update jika ada perbedaan
        if ($dto->timezone !== null && $user->timezone !== $dto->timezone) {
            $user->update(['timezone' => $dto->timezone]);
        }

        // Issue Access Token (valid for 60 mins)
        $accessToken = $user->createToken('access_token', ['access-api'], now()->addMinutes(60))->plainTextToken;

        // Issue Refresh Token (valid for 30 days)
        $refreshToken = $user->createToken('refresh_token', ['issue-access-token'], now()->addDays(30))->plainTextToken;

        // Log activity
        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: $user->id,
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: 'User logged in successfully'
        ));

        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'user' => $user,
        ];
    }
}
