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

    // Payment-page roles (see docs / kita-markup plan):
    // FINANCE = "kita" (platform/internal — sees every merchant, approves withdrawals).
    // FINANCE_DEVELOPER = "client" (merchant — sees its own data, requests withdrawals).
    case FINANCE = 'finance';
    case FINANCE_DEVELOPER = 'finance-developer';
}
