<?php

namespace App\Console\Commands;

use App\Models\MembershipSubscription;
use App\Models\User;
use App\Support\Wallet\WalletLedger;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Renews duration-based memberships from the member's wallet before they lapse.
 *
 * Deliberately a separate command from `memberships:expire`, not a branch
 * inside it: that one is "find lapsed → close row" and has a `--dry-run` that
 * has to stay honest. Renewal moves money, so it gets its own log, its own
 * failure modes and its own tests.
 *
 * The two need **no ordering guarantee**. Renewal writes a *successor*
 * subscription starting where the old one ends, so `ExpireMemberships`'s
 * existing `$stillCovered` check already sees the member as covered and closes
 * only the old row. Chaining them on a five-minute gap would have been the
 * fragile version of this.
 *
 * Runs a day early so the successor exists before the expiry sweep, and so an
 * insufficient balance can be reported while the member still has time to act.
 */
class RenewMemberships extends Command
{
    protected $signature = 'memberships:renew {--dry-run : Report what would change without charging}';

    protected $description = 'Charge the wallet to renew memberships that are about to lapse';

    /**
     * A plan whose price rose by more than this since purchase is skipped
     * rather than charged. Silently debiting a much larger figure than someone
     * agreed to is how disputes start.
     */
    private const PRICE_RISE_TOLERANCE = 1.2;

    public function handle(): int
    {
        $due = MembershipSubscription::with(['user', 'membershipPlan'])
            ->where('status', 'active')
            ->whereNotNull('ends_at')
            ->where('ends_at', '<=', now()->addDay())
            ->whereNull('renewed_into_id')
            ->get();

        if ($due->isEmpty()) {
            $this->info('No memberships due for renewal.');

            return self::SUCCESS;
        }

        $dryRun = (bool) $this->option('dry-run');
        $renewed = 0;
        $skipped = 0;

        foreach ($due as $subscription) {
            $reason = $this->cannotRenew($subscription);

            if ($reason !== null) {
                $skipped++;
                $this->line("  #{$subscription->id} skipped — {$reason}");

                continue;
            }

            if ($dryRun) {
                $this->line("  #{$subscription->id} would renew {$subscription->membershipPlan->code} for Rp ".number_format((int) $subscription->membershipPlan->price));

                continue;
            }

            try {
                $this->renew($subscription);
                $renewed++;
            } catch (Throwable $e) {
                // One member's failure must not abort the batch; the rest are
                // still owed their renewal tonight.
                $skipped++;
                Log::warning("Membership renewal failed for subscription {$subscription->id}: {$e->getMessage()}");
                $this->line("  #{$subscription->id} skipped — {$e->getMessage()}");
            }
        }

        $this->info($dryRun
            ? "Dry run: {$due->count()} due, {$skipped} would be skipped."
            : "Renewed {$renewed}, skipped {$skipped}.");

        return self::SUCCESS;
    }

    /** Why this subscription must not be charged, or null when it may be. */
    private function cannotRenew(MembershipSubscription $subscription): ?string
    {
        $user = $subscription->user;
        $plan = $subscription->membershipPlan;

        if (! $user || ! $plan) {
            return 'the member or plan no longer exists';
        }

        if (! $user->auto_renew) {
            return 'auto-renew is off';
        }

        if (! $plan->is_active) {
            return 'the plan has been discontinued';
        }

        if ($plan->isLifetime()) {
            // Should be unreachable: `ends_at` is not null here. Guard anyway —
            // charging again for something bought once is the worst outcome.
            return 'the plan is lifetime';
        }

        $pricePaid = (int) ($subscription->price_paid ?? 0);

        if ($pricePaid > 0 && (int) $plan->price > (int) round($pricePaid * self::PRICE_RISE_TOLERANCE)) {
            return 'the plan price rose too far since purchase';
        }

        if ((int) $user->balance < (int) $plan->price) {
            return 'the wallet cannot cover it';
        }

        return null;
    }

    private function renew(MembershipSubscription $subscription): void
    {
        DB::transaction(function () use ($subscription) {
            /** @var MembershipSubscription $locked */
            $locked = MembershipSubscription::whereKey($subscription->getKey())->lockForUpdate()->firstOrFail();

            // Re-checked under the lock: a concurrent run, or a manual renewal
            // through the storefront, may have already produced the successor.
            if ($locked->status !== 'active' || $locked->renewed_into_id !== null) {
                return;
            }

            $plan = $locked->membershipPlan;

            /** @var User $user */
            $user = User::whereKey($locked->user_id)->lockForUpdate()->firstOrFail();

            if ((int) $user->balance < (int) $plan->price) {
                throw new \RuntimeException('the wallet cannot cover it');
            }

            WalletLedger::record(
                user: $user->id,
                amount: -1 * (int) $plan->price,
                type: 'purchase',
                reference: 'MEMBERSHIP-RENEW-'.$plan->code,
                description: 'Perpanjangan otomatis: '.$plan->localizedName(),
            );

            $startsAt = $locked->ends_at ?? now();

            $successor = MembershipSubscription::create([
                'user_id' => $user->id,
                'membership_plan_id' => $plan->id,
                'starts_at' => $startsAt,
                'ends_at' => $startsAt->copy()->addDays((int) $plan->duration_days),
                'status' => 'active',
                'price_paid' => (int) $plan->price,
            ]);

            // The unique index on this column is the real guard: two workers on
            // separate connections cannot both claim the same predecessor.
            $locked->forceFill(['renewed_into_id' => $successor->id])->save();

            $user->forceFill([
                'membership_plan_id' => $plan->id,
                'membership_expires_at' => $successor->ends_at,
            ])->save();
        });
    }
}
