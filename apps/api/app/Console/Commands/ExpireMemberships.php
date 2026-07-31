<?php

namespace App\Console\Commands;

use App\Enums\RoleType;
use App\Models\MembershipSubscription;
use App\Models\Role;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Reverts members whose paid tier has lapsed.
 *
 * Without this a subscription's `ends_at` passes and nothing happens: the
 * member keeps the role their plan granted, and `RolePrice` keeps quoting them
 * VIP/reseller/agent pricing forever. The purchase is what grants the role, so
 * the expiry has to be what takes it away.
 */
class ExpireMemberships extends Command
{
    protected $signature = 'memberships:expire {--dry-run : Report what would change without writing}';

    protected $description = 'Expire lapsed membership subscriptions and restore the default member role';

    public function handle(): int
    {
        $memberRoleId = Role::whereRaw('LOWER(name) = ?', [RoleType::MEMBER->value])->value('id');

        if (! $memberRoleId) {
            $this->error('No MEMBER role found — cannot determine what to revert to.');

            return self::FAILURE;
        }

        $lapsed = MembershipSubscription::with('user')
            ->where('status', 'active')
            ->where('ends_at', '<=', now())
            ->get();

        if ($lapsed->isEmpty()) {
            $this->info('No lapsed memberships.');

            return self::SUCCESS;
        }

        $dryRun = (bool) $this->option('dry-run');
        $reverted = 0;

        foreach ($lapsed as $subscription) {
            $user = $subscription->user;

            // A member who renewed onto a later subscription is not lapsed —
            // only this particular row is. Closing it must not strip the role
            // their current plan still grants.
            $stillCovered = $user && MembershipSubscription::where('user_id', $user->id)
                ->where('status', 'active')
                ->whereKeyNot($subscription->id)
                ->where('ends_at', '>', now())
                ->exists();

            if ($dryRun) {
                $this->line(sprintf(
                    '  #%d %s — %s',
                    $subscription->id,
                    $user?->email ?? 'unknown user',
                    $stillCovered ? 'closing row only (covered by a later plan)' : 'reverting to member',
                ));

                continue;
            }

            DB::transaction(function () use ($subscription, $user, $stillCovered, $memberRoleId, &$reverted) {
                $subscription->update(['status' => 'expired']);

                if (! $user || $stillCovered) {
                    return;
                }

                $user->forceFill([
                    'role_id' => $memberRoleId,
                    'membership_expires_at' => null,
                ])->save();

                $reverted++;
            });
        }

        $this->info($dryRun
            ? sprintf('Dry run: %d lapsed subscription(s) would be closed.', $lapsed->count())
            : sprintf('Closed %d subscription(s); reverted %d user(s) to member.', $lapsed->count(), $reverted));

        return self::SUCCESS;
    }
}
