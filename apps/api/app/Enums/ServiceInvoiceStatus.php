<?php

declare(strict_types=1);

namespace App\Enums;

enum ServiceInvoiceStatus: string
{
    case UNPAID = 'UNPAID';                             // Issued; the client has not sent proof yet.
    case WAITING_CONFIRMATION = 'WAITING_CONFIRMATION';  // Proof uploaded, waiting on kita. Never auto-expires.
    case PAID = 'PAID';                                 // Confirmed by kita; the subscription exists. Terminal.
    case REJECTED = 'REJECTED';                         // Proof refused; the client may upload again.
    case CANCELLED = 'CANCELLED';                       // Withdrawn before payment. Terminal.
    case EXPIRED = 'EXPIRED';                           // Passed `due_at` while still UNPAID. Terminal.
}
