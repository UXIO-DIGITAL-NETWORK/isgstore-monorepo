<?php

declare(strict_types=1);

namespace App\Notifications\Channels;

use App\Contracts\RefundCompletedChannel;
use App\Mail\RefundMail;
use App\Models\RefundRequest;
use Illuminate\Support\Facades\Mail;

/**
 * "The transfer has been made", by email.
 */
class RefundCompletedEmailChannel implements RefundCompletedChannel
{
    public function send(RefundRequest $refund, string $locale): bool
    {
        if (! $refund->contact_email) {
            return false;
        }

        Mail::to($refund->contact_email)
            ->locale($locale)
            ->queue(new RefundMail($refund, $locale, RefundMail::VARIANT_COMPLETED));

        return true;
    }
}
