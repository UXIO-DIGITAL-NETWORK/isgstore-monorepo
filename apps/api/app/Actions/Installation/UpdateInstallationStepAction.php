<?php

declare(strict_types=1);

namespace App\Actions\Installation;

use App\Models\ServiceInstallationStep;

class UpdateInstallationStepAction
{
    public function execute(ServiceInstallationStep $step, array $data): ServiceInstallationStep
    {
        $step->update($data);

        return $step->fresh();
    }
}
