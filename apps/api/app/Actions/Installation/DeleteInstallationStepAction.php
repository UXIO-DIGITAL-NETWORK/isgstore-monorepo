<?php

declare(strict_types=1);

namespace App\Actions\Installation;

use App\Models\ServiceInstallationStep;

class DeleteInstallationStepAction
{
    public function execute(ServiceInstallationStep $step): void
    {
        $step->delete();
    }
}
