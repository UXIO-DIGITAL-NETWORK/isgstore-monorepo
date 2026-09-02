<?php

namespace Tests\Feature\Membership;

use App\Models\BalanceMutation;
use App\Models\MembershipPlan;
use App\Models\MembershipSubscription;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Auto-renewal debits a wallet on a schedule, unattended. Everything here is
 * about the ways that can go wrong: charging twice, charging a price nobody
 * agreed to, or charging someone who asked us to stop.
 */
class RenewMembershipsTest extends TestCase
{
    use RefreshDatabase;

    private function plan(array $overrides = []): MembershipPlan
    {
        return MembershipPlan::create(array_merge([
            'code' => 'hokage',
            'name' => ['id' => 'Hokage'],
            'price' => 10000,
            'duration_days' => 30,
            'is_active' => true,
            'sort_order' => 5,
        ], $overrides));
    }

    private function member(int $balance = 50000, bool $autoRenew = true): User
    {
        $role = Role::factory()->create(['name' => 'Member']);

        return User::factory()->create([
            'role_id' => $role->id,
            'balance' => $balance,
            'auto_renew' => $autoRenew,
        ]);
    }

    private function subscription(User $user, MembershipPlan $plan, array $overrides = []): MembershipSubscription
    {
        return MembershipSubscription::create(array_merge([
            'user_id' => $user->id,
            'membership_plan_id' => $plan->id,
            'starts_at' => now()->subDays(29),
            'ends_at' => now()->addHours(6),
            'status' => 'active',
            'price_paid' => (int) $plan->price,
        ], $overrides));
    }

    public function test_it_charges_the_wallet_and_writes_a_successor(): void
    {
        $plan = $this->plan();
        $user = $this->member();
        $subscription = $this->subscription($user, $plan);

        $this->artisan('memberships:renew')->assertSuccessful();

        $this->assertSame(40000, (int) $user->fresh()->balance);

        $successor = $subscription->fresh()->renewedInto;
        $this->assertNotNull($successor, 'The successor is the idempotency key.');
        // It starts where the old one ends: that is what makes the expiry sweep
        // see the member as still covered, with no ordering between the jobs.
        $this->assertSame(
            $subscription->ends_at->toDateTimeString(),
            $successor->starts_at->toDateTimeString(),
        );
        $this->assertSame(10000, (int) $successor->price_paid);
    }

    public function test_running_twice_charges_once(): void
    {
        $plan = $this->plan();
        $user = $this->member();
        $this->subscription($user, $plan);

        $this->artisan('memberships:renew')->assertSuccessful();
        $this->artisan('memberships:renew')->assertSuccessful();

        $this->assertSame(40000, (int) $user->fresh()->balance);
        $this->assertSame(1, BalanceMutation::where('user_id', $user->id)->count());
    }

    public function test_it_skips_a_member_who_turned_auto_renew_off(): void
    {
        $plan = $this->plan();
        $user = $this->member(autoRenew: false);
        $this->subscription($user, $plan);

        $this->artisan('memberships:renew')->assertSuccessful();

        $this->assertSame(50000, (int) $user->fresh()->balance);
        $this->assertSame(0, BalanceMutation::count());
    }

    public function test_it_skips_a_wallet_that_cannot_cover_the_plan(): void
    {
        // The membership simply lapses through the normal expiry sweep — we do
        // not partially charge, and we do not push the balance negative.
        $plan = $this->plan();
        $user = $this->member(balance: 500);
        $this->subscription($user, $plan);

        $this->artisan('memberships:renew')->assertSuccessful();

        $this->assertSame(500, (int) $user->fresh()->balance);
        $this->assertNull(MembershipSubscription::first()->renewed_into_id);
    }

    public function test_it_skips_a_discontinued_plan(): void
    {
        $plan = $this->plan(['is_active' => false]);
        $user = $this->member();
        $this->subscription($user, $plan);

        $this->artisan('memberships:renew')->assertSuccessful();

        $this->assertSame(50000, (int) $user->fresh()->balance);
    }

    public function test_it_refuses_to_charge_a_price_that_rose_too_far(): void
    {
        // Silently debiting far more than the member agreed to is how disputes
        // start. They are told instead, and the membership lapses normally.
        $plan = $this->plan();
        $user = $this->member();
        $this->subscription($user, $plan, ['price_paid' => 10000]);

        $plan->update(['price' => 30000]);

        $this->artisan('memberships:renew')->assertSuccessful();

        $this->assertSame(50000, (int) $user->fresh()->balance);
    }

    public function test_a_lifetime_subscription_is_never_renewed(): void
    {
        $plan = $this->plan(['duration_days' => null]);
        $user = $this->member();
        $this->subscription($user, $plan, ['ends_at' => null]);

        $this->artisan('memberships:renew')->assertSuccessful();

        $this->assertSame(50000, (int) $user->fresh()->balance);
    }

    public function test_dry_run_charges_nothing(): void
    {
        $plan = $this->plan();
        $user = $this->member();
        $this->subscription($user, $plan);

        $this->artisan('memberships:renew', ['--dry-run' => true])->assertSuccessful();

        $this->assertSame(50000, (int) $user->fresh()->balance);
    }

    public function test_expire_does_not_demote_a_member_who_was_just_renewed(): void
    {
        // The successor covers them, so the expiry sweep closes only the old
        // row. This is why the two commands need no ordering guarantee.
        $plan = $this->plan();
        $user = $this->member();
        $subscription = $this->subscription($user, $plan, ['ends_at' => now()->subMinute()]);

        $this->artisan('memberships:renew')->assertSuccessful();
        $this->artisan('memberships:expire')->assertSuccessful();

        $this->assertSame('expired', $subscription->fresh()->status);
        $this->assertSame($plan->id, (int) $user->fresh()->membership_plan_id);
    }

    public function test_a_member_can_switch_auto_renew_off(): void
    {
        $user = $this->member();
        Sanctum::actingAs($user, ['access-api']);

        $this->patchJson('/api/v1/me/membership/auto-renew', ['auto_renew' => false])
            ->assertOk()
            ->assertJsonPath('data.auto_renew', false);

        $this->assertFalse((bool) $user->fresh()->auto_renew);
    }
}
