<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\MembershipPlan;
use App\Models\User;
use RuntimeException;

/**
 * Two invariants the schema cannot express on MySQL.
 *
 * 1. **Exactly one default plan.** MySQL has no partial unique index, so
 *    "unique where is_default" has to live here. Promoting a plan demotes the
 *    incumbent rather than refusing — an admin who marks a new default means it.
 * 2. **The default plan cannot be deleted.** Every price resolution falls
 *    through to it, guests included, so deleting it would not degrade the
 *    storefront — it would stop it quoting a price at all.
 * 3. **Deleting a plan moves its holders to the default tier.** `PlanPrice`
 *    resolves per product row and cannot afford an existence check on each one,
 *    so a deleted plan would otherwise keep pricing people forever from a row
 *    the admin can no longer see. Reassigning at the moment of deletion is one
 *    write, on an action an admin deliberately took.
 */
class MembershipPlanObserver
{
    public function saving(MembershipPlan $plan): void
    {
        if (! $plan->is_default) {
            return;
        }

        MembershipPlan::query()
            ->where('is_default', true)
            ->when($plan->exists, fn ($q) => $q->whereKeyNot($plan->getKey()))
            ->update(['is_default' => false]);
    }

    public function deleting(MembershipPlan $plan): void
    {
        if ($plan->is_default) {
            throw new RuntimeException('Paket default tidak bisa dihapus. Tandai paket lain sebagai default terlebih dahulu.');
        }
    }

    public function deleted(MembershipPlan $plan): void
    {
        $defaultPlanId = MembershipPlan::query()
            ->where('is_default', true)
            ->whereKeyNot($plan->getKey())
            ->orderBy('id')
            ->value('id');

        if ($defaultPlanId === null) {
            return;
        }

        User::query()
            ->where('membership_plan_id', $plan->getKey())
            ->update(['membership_plan_id' => $defaultPlanId]);
    }
}
