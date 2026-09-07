<?php

declare(strict_types=1);

namespace App\Enums;

enum WithdrawalStatus: string
{
    case PENDING = 'PENDING';       // Requested by the merchant, awaiting kita's review.
    case APPROVED = 'APPROVED';     // Approved by kita, payout not yet dispatched.
    case PROCESSING = 'PROCESSING'; // Disbursement handed to Monetapay, awaiting result.
    case SETTLED = 'SETTLED';       // Funds delivered to the merchant. Terminal (success).
    case REJECTED = 'REJECTED';     // Declined by kita; the held amount was refunded. Terminal.
    case FAILED = 'FAILED';         // Payout attempt failed; the held amount was refunded. Terminal.
}
