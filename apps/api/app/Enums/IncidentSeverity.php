<?php

declare(strict_types=1);

namespace App\Enums;

enum IncidentSeverity: string
{
    case MINOR = 'MINOR';       // Degraded but usable.
    case MAJOR = 'MAJOR';       // Substantially impaired.
    case CRITICAL = 'CRITICAL'; // Unusable.
}
