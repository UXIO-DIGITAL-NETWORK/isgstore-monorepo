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
    // PAYMENT_INTERNAL = "kita" (internal team — verifies withdrawals, sets admin fee &
    //   per-channel fees, sees every merchant).
    // PAYMENT_ADMIN = "client" (merchant — sees its own data, requests withdrawals).
    case PAYMENT_INTERNAL = 'payment-internal';
    case PAYMENT_ADMIN = 'payment-admin';
}
