<?php

declare(strict_types=1);

namespace App\Actions\Incident;

use App\Models\ServiceIncident;

class DeleteIncidentAction
{
    public function execute(ServiceIncident $incident): void
    {
        $incident->delete();
    }
}
