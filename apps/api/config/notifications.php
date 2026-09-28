<?php

declare(strict_types=1);

use App\Notifications\Channels\EmailReceiptChannel;
use App\Notifications\Channels\RefundClaimEmailChannel;
use App\Notifications\Channels\RefundClaimWhatsAppChannel;
use App\Notifications\Channels\RefundCompletedEmailChannel;
use App\Notifications\Channels\RefundCompletedWhatsAppChannel;
use App\Notifications\Channels\WhatsAppReceiptChannel;

return [

    /*
    |--------------------------------------------------------------------------
    | Receipt channels
    |--------------------------------------------------------------------------
    |
    | Where a COMPLETED order's receipt is delivered, in order. Every channel
    | runs independently: each brings its own recipient and its own idempotency
    | guard, so one going quiet (a guest with no phone number) does not stop the
    | others.
    |
    | This is a client's seam. Adding WhatsApp, a client's own SMS gateway, or a
    | social-media webhook means adding ONE class here — the engine
    | (SendTransactionReceiptAction) is not touched. Order is for readability;
    | the guard is per channel, never positional.
    |
    */

    'receipt' => [
        EmailReceiptChannel::class,
        WhatsAppReceiptChannel::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Refund channels
    |--------------------------------------------------------------------------
    |
    | Two moments, two lists. The claim list is only reached once the claim link
    | could actually be built — an unreachable storefront URL stops the send
    | before any channel runs. The completed list runs when the transfer has
    | been made.
    |
    | Unlike the receipt seam, channels here carry no idempotency guard of their
    | own: `claim_notified_at` belongs to the flow (one refund, one
    | notification, however many channels carried it).
    |
    */

    'refund_claim' => [
        RefundClaimEmailChannel::class,
        RefundClaimWhatsAppChannel::class,
    ],

    'refund_completed' => [
        RefundCompletedEmailChannel::class,
        RefundCompletedWhatsAppChannel::class,
    ],

];
