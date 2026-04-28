<?php

namespace App\Actions\Banner;

use App\Models\Banner;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Auth;

class DeleteBannerAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Banner $banner): bool
    {
        $name = $banner->name;
        $deleted = $banner->delete();

        if ($deleted) {
            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Admin deleted Banner: {$name}",
            ));
        }

        return $deleted;
    }
}
