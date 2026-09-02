<?php

declare(strict_types=1);

namespace App\Support\Membership;

use App\Models\MembershipPlan;

/**
 * The free tier every account without a subscription is priced at.
 *
 * Guests resolve here too, which is what makes a public catalogue quotable at
 * all. `MembershipPlanObserver` guarantees exactly one row carries the flag and
 * refuses to delete it.
 *
 * Resolved fresh on every call rather than memoised — the same reasoning as
 * `App\Support\Payment\DefaultMerchant`: a cached id survives a
 * `RefreshDatabase` boundary and turns one test's plan into another's.
 */
final class DefaultPlan
{
    public static function id(): ?int
    {
        $id = MembershipPlan::query()->where('is_default', true)->orderBy('id')->value('id');

        return $id ? (int) $id : null;
    }

    public static function get(): ?MembershipPlan
    {
        return MembershipPlan::query()->where('is_default', true)->orderBy('id')->first();
    }
}
