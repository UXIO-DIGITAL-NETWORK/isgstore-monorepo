<?php

declare(strict_types=1);

use App\Notifications\Channels\EmailReceiptChannel;
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

];
