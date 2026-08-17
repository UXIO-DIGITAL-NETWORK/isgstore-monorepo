<?php

namespace App\Enums;

/**
 * transactions.status — values match the DB enum column exactly, so API
 * output and stored data are unchanged by the enum cast.
 */
enum TransactionStatus: string
{
    case PENDING = 'PENDING';
    case PAID = 'PAID';
    case PROCESSING = 'PROCESSING';
    case COMPLETED = 'COMPLETED';
    case FAILED_PROVIDER = 'FAILED_PROVIDER';
    case EXPIRED = 'EXPIRED';
    case REFUNDED = 'REFUNDED';

    /**
     * Statuses where the customer has actually paid — the point money is
     * collected and a merchant/platform settlement is booked. Shared by the
     * finance/merchant dashboards and the settlement backfill so "earned"
     * revenue is defined in exactly one place.
     */
    public static function paidStates(): array
    {
        return [self::PAID->value, self::PROCESSING->value, self::COMPLETED->value];
    }
}
