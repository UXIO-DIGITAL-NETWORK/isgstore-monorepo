<?php

declare(strict_types=1);

namespace App\Actions\Incident;

use App\Enums\IncidentStatus;
use App\Models\ServiceIncident;

class UpdateIncidentAction
{
    public function execute(ServiceIncident $incident, array $data): ServiceIncident
    {
        $becomesResolved = ($data['status'] ?? null) === IncidentStatus::RESOLVED->value;

        if ($becomesResolved && ! $incident->resolved_at) {
            $data['resolved_at'] = now();
        }

        // Reopening clears the stamp, so "resolved_at is set" always means
        // "closed" rather than "was closed once".
        if (array_key_exists('status', $data) && ! $becomesResolved) {
            $data['resolved_at'] = null;
        }

        $incident->update($data);

        return $incident->fresh();
    }
}
