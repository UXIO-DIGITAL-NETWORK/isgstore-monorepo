<?php

namespace App\Actions\User;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\User;
use App\Support\DateTime\Wib;
use Illuminate\Support\Facades\Auth;

class SyncUserTimezoneAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    /**
     * Normalises the account onto the platform's one wall clock.
     *
     * The endpoint survives so an older client keeps working, but the zone it
     * sends is deliberately ignored: honouring it would let a browser abroad
     * pull the panel's clock away from the zone every report window is bucketed
     * in, which is the disagreement this account of the setting exists to
     * prevent. Returns true when the account is already correct.
     */
    public function execute(User $user): bool
    {
        if ($user->timezone === Wib::TZ) {
            return true;
        }

        $updated = $user->update(['timezone' => Wib::TZ]);

        if ($updated) {
            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id() ?? $user->id,
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: 'Synced user timezone to: '.Wib::TZ
            ));
        }

        return $updated;
    }
}
