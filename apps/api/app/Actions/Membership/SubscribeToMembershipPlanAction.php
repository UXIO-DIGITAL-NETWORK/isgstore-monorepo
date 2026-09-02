<?php

declare(strict_types=1);

namespace App\Actions\Membership;

use App\DTOs\Membership\SubscribeMembershipDTO;
use App\Models\MembershipPlan;
use App\Models\MembershipSubscription;
use App\Models\User;
use App\Support\Money;
use App\Support\Wallet\WalletLedger;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Buy a membership plan with wallet balance.
 *
 * Paying from the wallet rather than opening a second gateway flow keeps the
 * purchase atomic: the debit, the subscription and the entitlement all commit
 * together, so there is no window where money has left the wallet but the
 * membership has not started. Members top the wallet up first.
 *
 * **This no longer rewrites `users.role_id`.** The plan itself is the pricing
 * tier now (`users.membership_plan_id` → `product_plan_prices`), and roles are
 * back to gating access. Keeping both would leave two sources of truth for what
 * a customer pays, free to disagree without anything noticing.
 *
 * Extracted from `MembershipController`, which held all of this inline against
 * the Route → FormRequest → Action convention.
 */
class SubscribeToMembershipPlanAction
{
    public function execute(User $user, SubscribeMembershipDTO $dto): MembershipSubscription
    {
        return DB::transaction(function () use ($user, $dto) {
            /** @var MembershipPlan $plan */
            $plan = MembershipPlan::where('is_active', true)->findOrFail($dto->membershipPlanId);

            /** @var User $locked */
            $locked = User::whereKey($user->id)->lockForUpdate()->firstOrFail();

            if ((int) $locked->balance < (int) $plan->price) {
                throw new RuntimeException(
                    'Saldo tidak mencukupi. Silakan isi saldo terlebih dahulu. Sisa saldo: '
                    .Money::rupiah((int) $locked->balance)
                );
            }

            // A free plan moves no money; WalletLedger refuses a zero mutation,
            // and a statement line for "paid nothing" would be noise anyway.
            if ((int) $plan->price > 0) {
                WalletLedger::record(
                    user: $locked->id,
                    amount: -1 * (int) $plan->price,
                    type: 'purchase',
                    reference: 'MEMBERSHIP-'.$plan->code,
                    description: 'Upgrade membership: '.$plan->localizedName(),
                );
            }

            // Extends an existing membership rather than truncating it —
            // renewing early must not cost the member the days they have
            // already paid for. A lifetime membership has no end to stack onto,
            // so the new one simply starts now.
            $active = MembershipSubscription::where('user_id', $locked->id)
                ->currentlyActive()
                ->latest('ends_at')
                ->first();

            $startsAt = $active?->ends_at ?? now();

            $subscription = MembershipSubscription::create([
                'user_id' => $locked->id,
                'membership_plan_id' => $plan->id,
                'starts_at' => $startsAt,
                'ends_at' => $plan->isLifetime() ? null : $startsAt->copy()->addDays($plan->duration_days),
                'status' => 'active',
                // Frozen so a later price rise cannot be charged silently on
                // renewal — see `memberships:renew`.
                'price_paid' => (int) $plan->price,
            ]);

            // The plan is the entitlement. `membership_expires_at` stays a
            // display cache, NULL for lifetime.
            $locked->forceFill([
                'membership_plan_id' => $plan->id,
                'membership_expires_at' => $subscription->ends_at,
            ])->save();

            return $subscription;
        });
    }
}
