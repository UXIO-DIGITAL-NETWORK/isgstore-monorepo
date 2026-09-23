<?php

namespace App\Observers;

use App\Events\WithdrawalStatusUpdated;
use App\Jobs\SendDiscordActivityJob;
use App\Models\Withdrawal;

/**
 * Single choke point for realtime withdrawal broadcasts. Status changes happen
 * across several actions (approve, reject, payout job, disbursement callback,
 * the sync command); observing the model fires one event for any of them.
 */
class WithdrawalObserver
{
    public function created(Withdrawal $withdrawal): void
    {
        WithdrawalStatusUpdated::dispatch($withdrawal);

        SendDiscordActivityJob::withdrawalCreated($withdrawal);
    }

    public function updated(Withdrawal $withdrawal): void
    {
        if (! $withdrawal->wasChanged('status')) {
            return;
        }

        WithdrawalStatusUpdated::dispatch($withdrawal);

        SendDiscordActivityJob::withdrawalStatusChanged($withdrawal);
    }
}
