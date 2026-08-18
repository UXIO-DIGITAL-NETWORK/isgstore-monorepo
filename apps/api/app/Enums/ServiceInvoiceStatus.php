<?php

declare(strict_types=1);

namespace App\Enums;

enum ServiceInvoiceStatus: string
{
    case UNPAID = 'UNPAID';                             // Issued; not settled yet.
    // Legacy. Bills are settled through Monetapay now, so nothing produces
    // this any more — it is kept because rows issued under the old manual
    // bukti-transfer flow still carry it, and they must stay readable.
    case WAITING_CONFIRMATION = 'WAITING_CONFIRMATION';
    case PAID = 'PAID';                                 // Settled; the subscription exists. Terminal.
    case REJECTED = 'REJECTED';                         // Refused by kita; the client may pay again.
    case CANCELLED = 'CANCELLED';                       // Withdrawn before payment. Terminal.
    case EXPIRED = 'EXPIRED';                           // Passed `due_at` while still UNPAID. Terminal.
}
