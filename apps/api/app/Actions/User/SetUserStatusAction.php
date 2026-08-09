<?php

namespace App\Actions\User;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

/**
 * Sets a customer's account standing (active | suspended | banned). A suspended
 * or banned account is blocked from transacting; reactivation restores it.
 */
class SetUserStatusAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(User $user, string $status): User
    {
        $user->forceFill(['status' => $status])->save();

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Admin set status of user {$user->name} to {$status}",
        ));

        return $user->refresh();
    }
}
