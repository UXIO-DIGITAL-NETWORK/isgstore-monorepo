<?php

declare(strict_types=1);

namespace App\Actions\Installation;

use App\Models\ServiceInstallationStep;
use App\Models\User;

/**
 * Takes the desired state rather than toggling, so a retried request, a
 * double-tap, or two open tabs all converge instead of flip-flopping.
 */
class SetInstallationStepCompletionAction
{
    public function execute(ServiceInstallationStep $step, bool $completed, User $actor): ServiceInstallationStep
    {
        $step->update([
            // Set and cleared together — a completed_by with no completed_at
            // would read as "someone half-finished this".
            'completed_at' => $completed ? ($step->completed_at ?? now()) : null,
            'completed_by' => $completed ? ($step->completed_by ?? $actor->id) : null,
        ]);

        return $step->fresh();
    }
}
