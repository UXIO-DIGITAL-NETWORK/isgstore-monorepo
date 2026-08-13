<?php

declare(strict_types=1);

namespace App\Actions\Incident;

use App\Enums\IncidentStatus;
use App\Models\ServiceIncident;

class CreateIncidentAction
{
    public function execute(array $data): ServiceIncident
    {
        // An incident filed as already resolved still needs its closing stamp.
        if (($data['status'] ?? null) === IncidentStatus::RESOLVED->value) {
            $data['resolved_at'] ??= now();
        }

        return ServiceIncident::create($data);
    }
}
