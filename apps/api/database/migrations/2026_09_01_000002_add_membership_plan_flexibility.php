<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Membership stops being a way to buy a role and becomes the pricing tier itself.
 *
 * Until now a plan granted a `role_id`, and `App\Support\Pricing\RolePrice`
 * matched that role name against one of four fixed price columns on `products`.
 * That capped the platform at four tiers forever: a fifth plan an admin creates
 * could never have its own price. From here, price is keyed on the plan
 * (`product_plan_prices`), and the plan a customer holds lives on
 * `users.membership_plan_id`.
 *
 * Roles are not removed — they keep gating admin and payment-page access. They
 * simply stop deciding what anything costs.
 *
 * The default plan is inserted here rather than in a seeder because every
 * resolution falls through to it: a deployment holding the foreign key without
 * the row would fail every guest checkout. It is deliberately a NEW row rather
 * than a repurposed existing one — the site already sells a paid plan called
 * "Basic", and zeroing its price would give away what people paid for.
 */
return new class extends Migration
{
    /** The free tier every account without a subscription resolves to. */
    private const DEFAULT_PLAN_CODE = 'free';

    public function up(): void
    {
        Schema::table('membership_plans', function (Blueprint $table) {
            // Exactly one row may carry this. MySQL cannot express "unique
            // where true", so `MembershipPlanObserver` enforces it — and also
            // refuses to delete the row, since everything resolves through it.
            $table->boolean('is_default')->default(false)->after('is_active');
            // Read by the points feature: a plan that already buys a discount
            // does not also get to spend points.
            $table->boolean('allows_point_spending')->default(true)->after('is_default');
            // Soft delete, not hard: a hard delete cascades away the plan's
            // price rows, which repricing history and past invoices refer to.
            $table->softDeletes();
        });

        Schema::table('users', function (Blueprint $table) {
            // Null resolves to the default plan, so this is safe to be unset.
            // nullOnDelete rather than restrict: deleting a plan must not be
            // blocked by the accounts that held it, they simply fall back.
            $table->foreignId('membership_plan_id')->nullable()->after('role_id')
                ->constrained('membership_plans')->nullOnDelete();
            $table->index('membership_plan_id');
        });

        Schema::table('membership_subscriptions', function (Blueprint $table) {
            // What was actually charged, frozen. Auto-renew reads it so a plan
            // whose price rose since purchase cannot be re-billed silently at
            // the new figure — that is a dispute, not a renewal.
            $table->unsignedBigInteger('price_paid')->nullable()->after('membership_plan_id');
        });

        $this->insertDefaultPlan();
        $this->backfillUserPlans();
    }

    /**
     * The free default tier. Lifetime, priced at zero, no role attached — it
     * grants nothing except "this is what you pay when you pay nothing".
     */
    private function insertDefaultPlan(): void
    {
        $existing = DB::table('membership_plans')->where('code', self::DEFAULT_PLAN_CODE)->first();

        if ($existing) {
            // Idempotent: a re-run (or a deployment that already created it by
            // hand) marks the existing row rather than inserting a duplicate.
            DB::table('membership_plans')->where('id', $existing->id)->update(['is_default' => true]);

            return;
        }

        DB::table('membership_plans')->insert([
            'code' => self::DEFAULT_PLAN_CODE,
            'name' => json_encode(['id' => 'Basic', 'en' => 'Basic']),
            'benefits' => json_encode(['id' => [], 'en' => []]),
            'price' => 0,
            'duration_days' => null,
            'role_id' => null,
            'is_popular' => false,
            'is_active' => true,
            'is_default' => true,
            'allows_point_spending' => true,
            'sort_order' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Give every existing account the plan it is already entitled to.
     *
     * This runs inline, not in a follow-up command, because a null
     * `membership_plan_id` resolves to the free tier — so deferring it would
     * silently sell to every paying VIP/Reseller/Agent member at the base
     * price. That is a money bug, not a tidiness one.
     */
    private function backfillUserPlans(): void
    {
        // Correlated subqueries rather than UPDATE ... JOIN: SQLite backs the
        // test suite and does not support the join form, and this reads the
        // same on both drivers.
        $now = now()->toDateTimeString();

        // 1. Anyone holding a live subscription follows that subscription. The
        //    newest wins, matching how `currentlyActive()` is read elsewhere.
        DB::table('users')->update([
            'membership_plan_id' => DB::raw(
                '(select s.membership_plan_id from membership_subscriptions s'
                ." where s.user_id = users.id and s.status = 'active'"
                ." and (s.ends_at is null or s.ends_at > '{$now}')"
                .' order by s.id desc limit 1)'
            ),
        ]);

        // 2. Anyone else whose role was set by hand (or by an older flow) is
        //    mapped through the plan that used to grant that role. Whoever is
        //    left keeps NULL, which is the free tier — correct for them.
        DB::table('users')->whereNull('membership_plan_id')->update([
            'membership_plan_id' => DB::raw(
                '(select p.id from membership_plans p'
                .' where p.role_id = users.role_id order by p.id limit 1)'
            ),
        ]);
    }

    public function down(): void
    {
        Schema::table('membership_subscriptions', function (Blueprint $table) {
            $table->dropColumn('price_paid');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['membership_plan_id']);
            $table->dropIndex(['membership_plan_id']);
            $table->dropColumn('membership_plan_id');
        });

        Schema::table('membership_plans', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn(['is_default', 'allows_point_spending']);
        });

        // The default plan row is deliberately left behind: rolling back the
        // schema must not delete a plan that subscriptions may point at.
    }
};
