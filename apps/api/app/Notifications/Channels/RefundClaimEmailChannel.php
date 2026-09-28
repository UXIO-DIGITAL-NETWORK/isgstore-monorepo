<?php

declare(strict_types=1);

namespace App\Notifications\Channels;

use App\Contracts\RefundClaimChannel;
use App\Mail\RefundMail;
use App\Models\RefundRequest;
use Illuminate\Support\Facades\Mail;

/**
 * The claim link by email — currently the only channel that carries a usable
 * link, because WhatsApp delivery ships off until the subscription is on.
 */
class RefundClaimEmailChannel implements RefundClaimChannel
{
    public function send(RefundRequest $refund, string $claimUrl, string $locale): bool
    {
        if (! $refund->contact_email) {
            return false;
        }

        Mail::to($refund->contact_email)
            ->locale($locale)
            ->queue(new RefundMail($refund, $locale, RefundMail::VARIANT_CLAIM, $claimUrl));

        return true;
    }
}
