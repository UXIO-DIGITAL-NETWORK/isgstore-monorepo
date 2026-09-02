<?php

declare(strict_types=1);

namespace App\Support\Membership;

use App\Models\MembershipPlan;
use App\Models\User;

/**
 * Which membership plan a customer is priced on.
 *
 * One definition, because the catalogue and the invoice must agree: a quote
 * that used a different plan than the charge would show one price and bill
 * another.
 *
 * `users.membership_plan_id` is the single source of truth. It is maintained by
 * subscribing, by `memberships:expire`, and by the migration that backfilled
 * it. Roles no longer participate — they gate access, not price.
 */
final class MembershipResolver
{
    /** Null only when no default plan exists, which the observer prevents. */
    public static function planIdFor(?User $user): ?int
    {
        $planId = $user?->membership_plan_id;

        return $planId ? (int) $planId : DefaultPlan::id();
    }

    public static function planFor(?User $user): ?MembershipPlan
    {
        $planId = $user?->membership_plan_id;

        if (! $planId) {
            return DefaultPlan::get();
        }

        // A deactivated plan still prices the accounts that hold it: `is_active`
        // hides a plan from the storefront's upgrade page, it does not revoke
        // what someone already bought.
        return MembershipPlan::find($planId) ?? DefaultPlan::get();
    }
}
