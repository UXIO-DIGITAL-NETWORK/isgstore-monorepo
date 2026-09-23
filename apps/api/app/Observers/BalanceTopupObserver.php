<?php

namespace App\Observers;

use App\Jobs\SendDiscordActivityJob;
use App\Models\BalanceTopup;

/**
 * A wallet top-up is opened in its own table, with no Transaction and no
 * Payment behind it, so the transaction observer never sees it. This closes
 * that gap: the channel learns a top-up was requested (and the Monetapay
 * callback separately reports whether it was paid).
 *
 * Only `created`. The status moves to PAID/EXPIRED through the payment
 * callback, which already notifies — reporting it here too would double every
 * top-up.
 */
class BalanceTopupObserver
{
    public function created(BalanceTopup $topup): void
    {
        SendDiscordActivityJob::topupCreated($topup);
    }
}
