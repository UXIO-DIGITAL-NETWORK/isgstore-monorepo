<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Kind of service kita sells to its payment-page clients. An enum rather than a
 * table: the list changes rarely, and a table would need a join, a CRUD screen
 * and a seeder for no gain — the same call already made for `promos.scope`.
 */
enum ServiceCategory: string
{
    case PAYMENT_GATEWAY = 'payment-gateway'; // Monetapay and friends.
    case SUPPLIER = 'supplier';               // uxiolabs and other product suppliers.
    case COMMUNICATION = 'communication';     // Email, WhatsApp API.
    case INFRASTRUCTURE = 'infrastructure';   // Domain, hosting.
    case OTHER = 'other';

    public function label(): string
    {
        return match ($this) {
            self::PAYMENT_GATEWAY => 'Payment Gateway',
            self::SUPPLIER => 'Supplier',
            self::COMMUNICATION => 'Komunikasi',
            self::INFRASTRUCTURE => 'Infrastruktur',
            self::OTHER => 'Lainnya',
        };
    }
}
