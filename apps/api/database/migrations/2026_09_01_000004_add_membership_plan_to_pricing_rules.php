<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Pricing rules stop being keyed on a role name and become keyed on a plan.
 *
 * `role` was a free string ('member' | 'vip' | 'reseller' | 'agent') with no
 * foreign key, which is why it could never describe a plan an admin invented.
 *
 * NULL gains a meaning it did not have: a rule with no plan applies to **every**
 * plan, so the resolution chain in `PricingService` becomes
 *
 *   (category, plan) → (NULL, plan) → (category, NULL) → (NULL, NULL) → setting
 *
 * and an admin can set one category-wide markup without enumerating tiers.
 *
 * The `role` column is kept, unread and now nullable, for one release —
 * dropping it in the same deploy as the cutover would take the fallback away if
 * anything still writes it, and leaving it NOT NULL would make every new
 * plan-keyed rule fail. The four existing rows are translated inline.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pricing_rules', function (Blueprint $table) {
            $table->foreignId('membership_plan_id')->nullable()->after('category_id')
                ->constrained('membership_plans')->cascadeOnDelete();
        });

        $this->translateRolesToPlans();

        Schema::table('pricing_rules', function (Blueprint $table) {
            // Retired, but kept for one release so a missed writer degrades
            // instead of violating NOT NULL on a live pricing path. New rows
            // simply leave it null.
            $table->string('role')->nullable()->change();
            $table->dropUnique(['category_id', 'role']);
            // NOTE: MySQL treats NULLs as distinct, so this does NOT stop two
            // (NULL, NULL) rows. That was already true of (NULL, role); the
            // pricing-rule store action carries the application-level guard.
            $table->unique(['category_id', 'membership_plan_id']);
        });
    }

    /**
     * Point each existing rule at the plan that used to grant its role.
     *
     * A rule for `member` has no plan today — the free tier was never a plan —
     * so it becomes the default plan created by the previous migration.
     */
    private function translateRolesToPlans(): void
    {
        $defaultPlanId = DB::table('membership_plans')->where('is_default', true)->value('id');

        foreach (DB::table('pricing_rules')->whereNotNull('role')->get() as $rule) {
            $roleId = DB::table('roles')->whereRaw('LOWER(name) = ?', [strtolower((string) $rule->role)])->value('id');

            $planId = $roleId
                ? DB::table('membership_plans')->where('role_id', $roleId)->orderBy('id')->value('id')
                : null;

            DB::table('pricing_rules')->where('id', $rule->id)->update([
                'membership_plan_id' => $planId ?? $defaultPlanId,
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('pricing_rules', function (Blueprint $table) {
            $table->dropUnique(['category_id', 'membership_plan_id']);
            $table->dropForeign(['membership_plan_id']);
            $table->dropColumn('membership_plan_id');
            $table->string('role')->nullable(false)->change();
            $table->unique(['category_id', 'role']);
        });
    }
};
