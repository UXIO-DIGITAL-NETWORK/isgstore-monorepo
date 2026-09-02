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
 * plan-keyed rule fail. The existing rows are translated inline.
 *
 * Every step is guarded so the migration can be re-run. An earlier version
 * dropped the old unique index before creating its replacement and died on
 * MySQL halfway through (see up()), which committed the added column but never
 * recorded the migration — leaving `migrate` unable to move in either
 * direction until the steps became individually skippable.
 */
return new class extends Migration
{
    private const OLD_UNIQUE = 'pricing_rules_category_id_role_unique';

    private const NEW_UNIQUE = 'pricing_rules_category_id_membership_plan_id_unique';

    public function up(): void
    {
        if (! Schema::hasColumn('pricing_rules', 'membership_plan_id')) {
            Schema::table('pricing_rules', function (Blueprint $table) {
                $table->foreignId('membership_plan_id')->nullable()->after('category_id')
                    ->constrained('membership_plans')->cascadeOnDelete();
            });
        }

        $this->translateRolesToPlans();

        Schema::table('pricing_rules', function (Blueprint $table) {
            // Retired, but kept for one release so a missed writer degrades
            // instead of violating NOT NULL on a live pricing path. New rows
            // simply leave it null.
            $table->string('role')->nullable()->change();
        });

        // The replacement is created FIRST, and that ordering is load-bearing on
        // MySQL: `pricing_rules_category_id_role_unique` is the only index
        // backing the `category_id` foreign key, and InnoDB refuses to drop an
        // index a constraint still needs (errno 1553). Creating
        // (category_id, membership_plan_id) gives the constraint another index
        // with `category_id` leftmost, after which the old one is free to go.
        // SQLite has no such rule, so the test suite could never catch this.
        if (! $this->hasIndex(self::NEW_UNIQUE)) {
            $this->guardAgainstDuplicatePairs();
            Schema::table('pricing_rules', function (Blueprint $table) {
                // NOTE: MySQL treats NULLs as distinct, so this does NOT stop two
                // (NULL, NULL) rows. That was already true of (NULL, role); the
                // pricing-rule store action carries the application-level guard.
                $table->unique(['category_id', 'membership_plan_id']);
            });
        }

        if ($this->hasIndex(self::OLD_UNIQUE)) {
            Schema::table('pricing_rules', function (Blueprint $table) {
                $table->dropUnique(self::OLD_UNIQUE);
            });
        }
    }

    /**
     * Point each existing rule at the plan that used to grant its role.
     *
     * A rule for `member` has no plan today — the free tier was never a plan —
     * so it becomes the default plan created by the previous migration.
     *
     * Only fills rows that have no plan yet: on a re-run after a partial
     * failure this must not overwrite a value an admin has since corrected.
     */
    private function translateRolesToPlans(): void
    {
        $defaultPlanId = DB::table('membership_plans')->where('is_default', true)->value('id');

        $rules = DB::table('pricing_rules')
            ->whereNotNull('role')
            ->whereNull('membership_plan_id')
            ->get();

        foreach ($rules as $rule) {
            $roleId = DB::table('roles')->whereRaw('LOWER(name) = ?', [strtolower((string) $rule->role)])->value('id');

            $planId = $roleId
                ? DB::table('membership_plans')->where('role_id', $roleId)->orderBy('id')->value('id')
                : null;

            DB::table('pricing_rules')->where('id', $rule->id)->update([
                'membership_plan_id' => $planId ?? $defaultPlanId,
            ]);
        }
    }

    /**
     * Two roles can collapse onto the same plan — anything with no plan of its
     * own lands on the default tier — and two rules in one category that did
     * that would make the new unique index impossible to create.
     *
     * Detected up front so the failure names the rows instead of surfacing as a
     * bare 1062 from the middle of a schema change.
     */
    private function guardAgainstDuplicatePairs(): void
    {
        $duplicates = DB::table('pricing_rules')
            ->select('category_id', 'membership_plan_id', DB::raw('COUNT(*) as total'))
            ->whereNotNull('category_id')
            ->whereNotNull('membership_plan_id')
            ->groupBy('category_id', 'membership_plan_id')
            ->having('total', '>', 1)
            ->get();

        if ($duplicates->isEmpty()) {
            return;
        }

        $pairs = $duplicates
            ->map(fn ($row) => "category {$row->category_id} / plan {$row->membership_plan_id} ({$row->total} rules)")
            ->implode('; ');

        throw new RuntimeException(
            'Cannot key pricing rules on membership plan: several roles translated onto the same plan '.
            "within one category, so these rows would collide - {$pairs}. ".
            'Merge or delete the redundant pricing_rules rows, then run migrate again.'
        );
    }

    private function hasIndex(string $name): bool
    {
        foreach (Schema::getIndexes('pricing_rules') as $index) {
            if (($index['name'] ?? null) === $name) {
                return true;
            }
        }

        return false;
    }

    public function down(): void
    {
        // Mirror of up(), and mirrored for the same reason: recreate the index
        // that will back the category_id foreign key before removing the one
        // that currently backs it.
        if (! $this->hasIndex(self::OLD_UNIQUE)) {
            Schema::table('pricing_rules', function (Blueprint $table) {
                $table->unique(['category_id', 'role']);
            });
        }

        if ($this->hasIndex(self::NEW_UNIQUE)) {
            Schema::table('pricing_rules', function (Blueprint $table) {
                $table->dropUnique(self::NEW_UNIQUE);
            });
        }

        if (Schema::hasColumn('pricing_rules', 'membership_plan_id')) {
            Schema::table('pricing_rules', function (Blueprint $table) {
                // The foreign key goes before its index, or InnoDB refuses.
                $table->dropForeign(['membership_plan_id']);
                $table->dropColumn('membership_plan_id');
            });
        }

        Schema::table('pricing_rules', function (Blueprint $table) {
            $table->string('role')->nullable(false)->change();
        });
    }
};
