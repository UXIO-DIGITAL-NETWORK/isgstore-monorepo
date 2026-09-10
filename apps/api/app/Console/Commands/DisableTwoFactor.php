<?php

namespace App\Console\Commands;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Enums\ActivityType;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * The way back in when an admin loses their authenticator.
 *
 * Two-factor is mandatory for admins and there are deliberately **no recovery
 * codes** in this release: the admins are a small in-house team who already
 * have shell access, and recovery codes are a whole surface of their own —
 * generation, one-time display, single-use enforcement, and the near-certainty
 * that someone pastes them into a notes app.
 *
 * That reasoning stops holding the day two-factor is extended to
 * `payment-admin`: those are clients with no shell, and an artisan runbook then
 * means disabling a client's second factor over a support chat, which is itself
 * a social-engineering route. Ship recovery codes in that release, not before.
 *
 * Every use is written to the activity log, because "an admin's second factor
 * was removed" is exactly the event an audit needs to see.
 */
class DisableTwoFactor extends Command
{
    protected $signature = 'two-factor:disable {email : The account to unlock}';

    protected $description = "Remove an account's two-factor secret so it can enrol a new authenticator";

    public function handle(CreateActivityLogAction $activityLog): int
    {
        $user = User::where('email', $this->argument('email'))->first();

        if (! $user) {
            $this->error("No account with email {$this->argument('email')}.");

            return self::FAILURE;
        }

        if ($user->two_factor_confirmed_at === null) {
            $this->info("{$user->email} has no second factor configured.");

            return self::SUCCESS;
        }

        if (! $this->confirm("Remove the second factor from {$user->email}? They will be asked to enrol again on their next login.")) {
            $this->info('Cancelled.');

            return self::SUCCESS;
        }

        DB::transaction(function () use ($user) {
            $user->forceFill([
                'two_factor_secret' => null,
                // Including an unfinished authenticator move — this is the
                // recovery path, so it must leave nothing behind.
                'two_factor_pending_secret' => null,
                'two_factor_pending_created_at' => null,
                'two_factor_confirmed_at' => null,
                'two_factor_last_used_timestep' => null,
            ])->save();

            // Whoever is holding a session on this account should not keep it
            // through a recovery action.
            $user->tokens()->delete();
        });

        $activityLog->execute(new CreateActivityLogDTO(
            userId: $user->id,
            ipAddress: '127.0.0.1',
            userAgent: 'artisan two-factor:disable',
            message: "Two-factor authentication removed from {$user->email} via console",
            type: ActivityType::SECURITY,
        ));

        $this->info("Done. {$user->email} will be asked to enrol at the next login.");

        return self::SUCCESS;
    }
}
