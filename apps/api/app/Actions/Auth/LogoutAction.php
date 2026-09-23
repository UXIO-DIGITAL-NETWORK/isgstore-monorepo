<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class LogoutAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    /**
     * Execute the logout action.
     */
    public function execute(): void
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (! $user) {
            return;
        }

        // Every token, not just the one this request arrived with.
        //
        // Sanctum mints the access and refresh tokens as independent rows, so
        // there is no way to pick out "the refresh token belonging to this
        // device". Deleting only `currentAccessToken()` therefore closed the
        // 60-minute door and left the 30-day refresh token able to mint a fresh
        // pair — a logout that did not really log anyone out. The cost is that
        // signing out ends the session on every device, which is the safer
        // direction to be wrong in for a credential that outlives a password
        // change. (The Hub already does exactly this.)
        $user->tokens()->delete();

        // Log activity
        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: $user->id,
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: 'User logged out successfully'
        ));
    }
}
