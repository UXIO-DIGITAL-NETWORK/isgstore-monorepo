<?php

namespace Database\Seeders;

use App\Models\MembershipPlan;
use App\Support\Membership\DefaultPlan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Global (category_id = NULL) markup rules, one per membership plan.
 *
 * Markup falls as the tier rises — the paid plans are the discount. The free
 * default tier keeps the headline +20%, and each seeded plan undercuts it.
 *
 * Runs after MembershipPlanSeeder, and is idempotent on (category_id, plan) so
 * re-seeding a live database does not duplicate rules. Per-category overrides
 * are added through the pricing-rules admin API.
 */
class PricingRuleSeeder extends Seeder
{
    /** Plan code → global markup percent. */
    private const MARKUP_BY_PLAN = [
        'basic' => 15.00,
        'platinum' => 10.00,
        'gold' => 5.00,
    ];

    public function run(): void
    {
        $now = now();
        $rows = [];

        $defaultPlanId = DefaultPlan::id();

        if ($defaultPlanId !== null) {
            $rows[] = [
                'category_id' => null,
                'membership_plan_id' => $defaultPlanId,
                'markup_percent' => 20.00,
                'markup_flat' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach (self::MARKUP_BY_PLAN as $code => $percent) {
            $planId = MembershipPlan::where('code', $code)->value('id');

            if ($planId === null) {
                continue;
            }

            $rows[] = [
                'category_id' => null,
                'membership_plan_id' => $planId,
                'markup_percent' => $percent,
                'markup_flat' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach ($rows as $row) {
            DB::table('pricing_rules')->updateOrInsert(
                ['category_id' => $row['category_id'], 'membership_plan_id' => $row['membership_plan_id']],
                $row,
            );
        }
    }
}
