<?php

declare(strict_types=1);

namespace App\Actions\Member;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Enums\ActivityType;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ChangePasswordAction
{
    public function __construct(private readonly CreateActivityLogAction $activityLogAction) {}

    public function execute(User $user, string $currentPassword, string $newPassword): void
    {
        // Re-authenticate even though the caller holds a valid token: a stolen
        // token must not be enough to lock the real owner out of their account.
        if (! Hash::check($currentPassword, $user->password)) {
            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: $user->id,
                ipAddress: request()?->ip(),
                userAgent: request()?->userAgent(),
                message: 'Password change failed: wrong current password',
                type: ActivityType::FAILED,
            ));

            throw ValidationException::withMessages([
                'current_password' => 'Password saat ini tidak sesuai.',
            ]);
        }

        $user->update(['password' => $newPassword]);   // hashed by the model cast

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: $user->id,
            ipAddress: request()?->ip(),
            userAgent: request()?->userAgent(),
            message: 'Password changed',
            type: ActivityType::SECURITY,
        ));
    }
}
