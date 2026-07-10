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
}
