<?php

namespace App\Console\Commands;

use App\Models\MembershipSubscription;
use App\Support\Membership\DefaultPlan;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Reverts members whose paid tier has lapsed.
 *
 * Without this a subscription's `ends_at` passes and nothing happens: the
 * member keeps the plan they bought, and `PlanPrice` keeps quoting them that
 * tier's pricing forever. The purchase is what grants the plan, so the expiry
 * has to be what takes it away.
 *
 * It reverts `membership_plan_id` to the default (free) plan — **not**
 * `role_id`. Roles no longer decide price; the plan does. Touching the role
 * here would strip an admin-assigned role from someone whose only crime was
 * letting a subscription lapse.
 */
class ExpireMemberships extends Command
{
    protected $signature = 'memberships:expire {--dry-run : Report what would change without writing}';

    protected $description = 'Expire lapsed membership subscriptions and restore the default membership plan';

    public function handle(): int
    {
        $defaultPlanId = DefaultPlan::id();

        if (! $defaultPlanId) {
            $this->error('No default membership plan found — cannot determine what to revert to.');

            return self::FAILURE;
        }

        // whereNotNull first: a lifetime subscription has no `ends_at`, and
        // `ends_at <= now()` on NULL is not just false in SQL — it is the whole
        // reason this guard is explicit. Without it every lifetime buyer would be
        // reverted to MEMBER the first time this runs after their purchase.
        $lapsed = MembershipSubscription::with('user')
            ->where('status', 'active')
            ->whereNotNull('ends_at')
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
                ->currentlyActive()
                ->whereKeyNot($subscription->id)
                ->exists();

            if ($dryRun) {
                $this->line(sprintf(
                    '  #%d %s — %s',
                    $subscription->id,
                    $user?->email ?? 'unknown user',
                    $stillCovered ? 'closing row only (covered by a later plan)' : 'reverting to the default plan',
                ));

                continue;
            }

            DB::transaction(function () use ($subscription, $user, $stillCovered, $defaultPlanId, &$reverted) {
                $subscription->update(['status' => 'expired']);

                if (! $user || $stillCovered) {
                    return;
                }

                $user->forceFill([
                    'membership_plan_id' => $defaultPlanId,
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
