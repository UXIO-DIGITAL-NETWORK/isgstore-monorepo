<?php

declare(strict_types=1);

namespace App\Enums;

enum RoleType: string
{
    case ADMIN = 'admin';
    case MEMBER = 'member';
    case VIP = 'vip';
    case RESELLER = 'reseller';
    case AGENT = 'agent';
}
