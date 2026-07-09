<?php

namespace App\Enums;

/**
 * payments.status — stored as string in the DB ('1'..'4').
 */
enum PaymentStatus: string
{
    case PENDING = '1';
    case EXPIRED = '2';
    case SUCCESS = '3';
    case REFUNDED = '4';
}
