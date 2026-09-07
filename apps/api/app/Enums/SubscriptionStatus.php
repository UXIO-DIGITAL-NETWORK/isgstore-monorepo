<?php

declare(strict_types=1);

namespace App\Enums;

enum SubscriptionStatus: string
{
    case ACTIVE = 'ACTIVE';       // Inside its starts_at..ends_at window.
    case EXPIRED = 'EXPIRED';     // ends_at passed and no renewal covers it. Terminal.
    case CANCELLED = 'CANCELLED'; // Ended early by kita. Terminal.
}
