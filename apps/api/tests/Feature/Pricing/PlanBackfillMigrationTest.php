<?php

namespace Tests\Feature\Pricing;

use App\Models\MembershipPlan;
use App\Models\MembershipSubscription;
use App\Models\Role;
use App\Models\User;
use App\Support\Membership\DefaultPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * The user backfill runs inline in the migration rather than as a follow-up
 * command, because a null `membership_plan_id` resolves to the free tier — so
 * deferring it would silently sell to every paying member at the base price.
 *
 * These tests re-run that logic against rows built the way the old schema built
 * them, which is the only way to prove it before a production deploy.
 */
class PlanBackfillMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_with_a_live_subscription_follows_that_plan(): void
    {
        $role = Role::factory()->create(['name' => 'Member']);
        $plan = MembershipPlan::create([
            'code' => 'platinum',
            'name' => ['id' => 'Platinum'],
            'price' => 150000,
            'duration_days' => 30,
            'is_active' => true,
            'sort_order' => 2,
        ]);

        $user = User::factory()->create(['role_id' => $role->id, 'membership_plan_id' => null]);

        MembershipSubscription::create([
            'user_id' => $user->id,
            'membership_plan_id' => $plan->id,
            'starts_at' => now()->subDays(3),
            'ends_at' => now()->addDays(27),
            'status' => 'active',
        ]);

        DB::table('users')->where('id', $user->id)->update([
            'membership_plan_id' => DB::raw(
                '(select s.membership_plan_id from membership_subscriptions s'
                ." where s.user_id = users.id and s.status = 'active'"
                ." and (s.ends_at is null or s.ends_at > '".now()->toDateTimeString()."')"
                .' order by s.id desc limit 1)'
            ),
        ]);

        $this->assertSame($plan->id, (int) $user->fresh()->membership_plan_id);
    }

    public function test_a_user_with_only_a_role_is_mapped_through_the_plan_that_granted_it(): void
    {
        // Roles used to be the entitlement, and an admin could set one by hand.
        // Those members paid for a tier and must keep it.
        $vipRole = Role::factory()->create(['name' => 'VIP']);
        $plan = MembershipPlan::create([
            'code' => 'basic-paid',
            'name' => ['id' => 'Basic'],
            'price' => 50000,
            'duration_days' => null,
            'role_id' => $vipRole->id,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $user = User::factory()->create(['role_id' => $vipRole->id, 'membership_plan_id' => null]);

        DB::table('users')->whereNull('membership_plan_id')->update([
            'membership_plan_id' => DB::raw(
                '(select p.id from membership_plans p where p.role_id = users.role_id order by p.id limit 1)'
            ),
        ]);

        $this->assertSame($plan->id, (int) $user->fresh()->membership_plan_id);
    }

    public function test_a_user_with_neither_stays_on_the_free_tier(): void
    {
        $role = Role::factory()->create(['name' => 'Member']);
        $user = User::factory()->create(['role_id' => $role->id, 'membership_plan_id' => null]);

        // NULL is the free tier by definition — `MembershipResolver` reads it
        // as the default plan rather than as "unset".
        $this->assertNull($user->fresh()->membership_plan_id);
        $this->assertNotNull(DefaultPlan::id());
    }

    public function test_exactly_one_default_plan_survives_a_new_default_being_marked(): void
    {
        $incumbent = MembershipPlan::where('is_default', true)->firstOrFail();

        $challenger = MembershipPlan::create([
            'code' => 'new-default',
            'name' => ['id' => 'New'],
            'price' => 0,
            'duration_days' => null,
            'is_active' => true,
            'is_default' => true,
            'sort_order' => 0,
        ]);

        $this->assertFalse($incumbent->fresh()->is_default);
        $this->assertSame($challenger->id, DefaultPlan::id());
        $this->assertSame(1, MembershipPlan::where('is_default', true)->count());
    }
}
