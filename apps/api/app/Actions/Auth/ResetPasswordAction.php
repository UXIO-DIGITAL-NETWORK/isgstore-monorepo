<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Enums\ActivityType;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Complete a password reset from an emailed token.
 *
 * Revokes every existing token on success: a password reset is the recovery
 * path after a compromise, so leaving old sessions alive would defeat it.
 */
class ResetPasswordAction
{
    public function __construct(private readonly CreateActivityLogAction $activityLogAction) {}

    public function execute(array $credentials): void
    {
        $status = Password::reset($credentials, function (User $user, string $password) {
            $user->forceFill([
                'password' => $password,   // hashed by the model cast
                'remember_token' => Str::random(60),
            ])->save();

            $user->tokens()->delete();

            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: $user->id,
                ipAddress: request()?->ip(),
                userAgent: request()?->userAgent(),
                message: 'Password reset completed',
                type: ActivityType::SECURITY,
            ));

            event(new PasswordReset($user));
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => __($status),
            ]);
        }
    }
}
