<?php

namespace App\Enums;

enum PriceAlertStatus: string
{
    case PENDING = 'pending';
    case ACKNOWLEDGED = 'acknowledged';
}
