<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class LogoutAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}
    /**
     * Execute the logout action.
     *
     * @return void
     */
    public function execute(): void
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();

        if ($user && $user->currentAccessToken()) {
            // Revoke current access token
            $user->currentAccessToken()->delete();

            // Log activity
            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: $user->id,
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "User logged out successfully"
            ));
        }
    }
}
