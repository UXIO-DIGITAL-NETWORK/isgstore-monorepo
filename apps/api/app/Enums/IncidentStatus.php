<?php

declare(strict_types=1);

namespace App\Enums;

enum IncidentStatus: string
{
    case INVESTIGATING = 'INVESTIGATING'; // Reported, cause unknown.
    case IDENTIFIED = 'IDENTIFIED';       // Cause known, fix in progress.
    case MONITORING = 'MONITORING';       // Fix applied, watching for recurrence.
    case RESOLVED = 'RESOLVED';           // Closed. Terminal; stamps resolved_at.
}
