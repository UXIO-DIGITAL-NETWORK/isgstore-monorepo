<?php

namespace Tests\Feature\Membership;

use App\Models\MembershipPlan;
use App\Models\MembershipSubscription;
use App\Models\Role;
use App\Models\User;
use App\Support\Membership\DefaultPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpireMembershipsTest extends TestCase
{
    use RefreshDatabase;

    private function roles(): array
    {
        return [
            'member' => Role::factory()->create(['name' => 'Member'])->id,
            'vip' => Role::factory()->create(['name' => 'VIP'])->id,
        ];
    }

    private function plan(int $roleId, ?int $durationDays = 30): MembershipPlan
    {
        return MembershipPlan::create([
            'code' => 'basic-'.uniqid(),
            'name' => ['id' => 'Basic'],
            'benefits' => ['id' => []],
            'price' => 50000,
            'duration_days' => $durationDays,
            'role_id' => $roleId,
            'is_active' => true,
        ]);
    }

    /**
     * The whole point of a lifetime plan. `ends_at` is NULL, and a plain
     * `ends_at <= now()` sweep would have demoted the buyer on the first nightly
     * run after their purchase — money taken, tier taken back.
     */
    public function test_it_never_expires_a_lifetime_membership(): void
    {
        ['member' => $memberRole, 'vip' => $vipRole] = $this->roles();

        $user = User::factory()->create(['role_id' => $vipRole, 'membership_expires_at' => null]);

        MembershipSubscription::create([
            'user_id' => $user->id,
            'membership_plan_id' => $this->plan($vipRole, null)->id,
            'starts_at' => now()->subYears(3),
            'ends_at' => null,
            'status' => 'active',
        ]);

        $this->travel(10)->years();
        $this->artisan('memberships:expire')->assertSuccessful();

        $user->refresh();
        $this->assertSame($vipRole, $user->role_id, 'A lifetime member keeps their tier forever.');
        $this->assertSame('active', MembershipSubscription::first()->status);
    }

    /**
     * A lifetime row also has to COUNT as cover: closing an old finite plan must
     * not strip the tier the lifetime plan still grants.
     */
    public function test_a_lifetime_membership_covers_a_lapsed_one(): void
    {
        ['member' => $memberRole, 'vip' => $vipRole] = $this->roles();

        $user = User::factory()->create(['role_id' => $vipRole]);

        $lapsed = MembershipSubscription::create([
            'user_id' => $user->id,
            'membership_plan_id' => $this->plan($vipRole)->id,
            'starts_at' => now()->subDays(31),
            'ends_at' => now()->subDay(),
            'status' => 'active',
        ]);

        MembershipSubscription::create([
            'user_id' => $user->id,
            'membership_plan_id' => $this->plan($vipRole, null)->id,
            'starts_at' => now()->subDay(),
            'ends_at' => null,
            'status' => 'active',
        ]);

        $this->artisan('memberships:expire')->assertSuccessful();

        $user->refresh();
        $this->assertSame($vipRole, $user->role_id);
        $this->assertNotSame($memberRole, $user->role_id);
        $this->assertSame('expired', $lapsed->fresh()->status);
    }

    public function test_it_reverts_a_lapsed_member_to_the_default_role(): void
    {
        ['member' => $memberRole, 'vip' => $vipRole] = $this->roles();

        $user = User::factory()->create(['role_id' => $vipRole, 'membership_expires_at' => now()->subDay()]);

        MembershipSubscription::create([
            'user_id' => $user->id,
            'membership_plan_id' => $this->plan($vipRole)->id,
            'starts_at' => now()->subDays(31),
            'ends_at' => now()->subDay(),
            'status' => 'active',
        ]);

        $this->artisan('memberships:expire')->assertSuccessful();

        $user->refresh();
        // The plan is the pricing tier, so the plan is what is taken back. The
        // role is deliberately untouched — reverting it would strip whatever an
        // admin had assigned from someone who merely let a subscription lapse.
        $this->assertSame(DefaultPlan::id(), $user->membership_plan_id, 'A lapsed member must stop being quoted their old tier.');
        $this->assertSame($vipRole, $user->role_id, 'Expiry must not touch access roles.');
        $this->assertNull($user->membership_expires_at);
        $this->assertSame('expired', MembershipSubscription::first()->status);
    }

    public function test_it_leaves_a_membership_that_has_not_lapsed_alone(): void
    {
        ['vip' => $vipRole] = $this->roles();

        $user = User::factory()->create(['role_id' => $vipRole, 'membership_expires_at' => now()->addDays(10)]);

        MembershipSubscription::create([
            'user_id' => $user->id,
            'membership_plan_id' => $this->plan($vipRole)->id,
            'starts_at' => now()->subDays(20),
            'ends_at' => now()->addDays(10),
            'status' => 'active',
        ]);

        $this->artisan('memberships:expire')->assertSuccessful();

        $this->assertSame($vipRole, $user->refresh()->role_id);
        $this->assertSame('active', MembershipSubscription::first()->status);
    }

    /**
     * Renewing early creates a second subscription starting where the first
     * ends. When the first lapses, closing it must not strip the role the
     * second still pays for — otherwise renewing early would demote you.
     */
    public function test_it_does_not_demote_a_member_covered_by_a_later_plan(): void
    {
        ['vip' => $vipRole] = $this->roles();

        $user = User::factory()->create(['role_id' => $vipRole, 'membership_expires_at' => now()->addDays(30)]);
        $plan = $this->plan($vipRole);

        $lapsed = MembershipSubscription::create([
            'user_id' => $user->id,
            'membership_plan_id' => $plan->id,
            'starts_at' => now()->subDays(31),
            'ends_at' => now()->subDay(),
            'status' => 'active',
        ]);

        MembershipSubscription::create([
            'user_id' => $user->id,
            'membership_plan_id' => $plan->id,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(30),
            'status' => 'active',
        ]);

        $this->artisan('memberships:expire')->assertSuccessful();

        $this->assertSame($vipRole, $user->refresh()->role_id, 'Renewing early must not cost the member their tier.');
        $this->assertSame('expired', $lapsed->refresh()->status);
    }

    public function test_dry_run_reports_without_writing(): void
    {
        ['member' => $memberRole, 'vip' => $vipRole] = $this->roles();

        $user = User::factory()->create(['role_id' => $vipRole]);

        MembershipSubscription::create([
            'user_id' => $user->id,
            'membership_plan_id' => $this->plan($vipRole)->id,
            'starts_at' => now()->subDays(31),
            'ends_at' => now()->subDay(),
            'status' => 'active',
        ]);

        $this->artisan('memberships:expire --dry-run')->assertSuccessful();

        $this->assertSame($vipRole, $user->refresh()->role_id);
        $this->assertNotSame($memberRole, $user->role_id);
        $this->assertSame('active', MembershipSubscription::first()->status);
    }
}
