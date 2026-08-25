<?php

namespace Tests\Feature\Membership;

use App\Models\MembershipPlan;
use App\Models\MembershipSubscription;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * `POST /v1/me/membership/subscribe` — the one place that debits the wallet,
 * writes the subscription and grants the tier role, all in one transaction.
 *
 * It had no coverage at all, which is how a lifetime plan could have shipped
 * with an expiry silently computed from `addDays(null)`.
 */
class SubscribeToMembershipTest extends TestCase
{
    use RefreshDatabase;

    private array $roles = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->roles = [
            'member' => Role::factory()->create(['name' => 'Member'])->id,
            'vip' => Role::factory()->create(['name' => 'VIP'])->id,
        ];
    }

    private function plan(?int $durationDays): MembershipPlan
    {
        return MembershipPlan::create([
            'code' => 'plan-'.uniqid(),
            'name' => ['id' => 'Basic'],
            'benefits' => ['id' => []],
            'price' => 50000,
            'duration_days' => $durationDays,
            'role_id' => $this->roles['vip'],
            'is_active' => true,
        ]);
    }

    private function member(int $balance): User
    {
        $user = User::factory()->create(['role_id' => $this->roles['member'], 'balance' => $balance]);
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_buying_a_lifetime_plan_grants_the_tier_with_no_expiry(): void
    {
        $user = $this->member(100000);
        $plan = $this->plan(null);

        $this->postJson('/api/v1/me/membership/subscribe', ['membership_plan_id' => $plan->id])
            ->assertCreated()
            ->assertJsonPath('data.ends_at', null);

        $subscription = MembershipSubscription::sole();
        $this->assertNull($subscription->ends_at, 'A lifetime plan must not compute an expiry.');
        $this->assertSame('active', $subscription->status);

        $user->refresh();
        $this->assertSame($this->roles['vip'], $user->role_id);
        $this->assertNull($user->membership_expires_at);
        $this->assertSame(50000, (int) $user->balance, 'The plan price must leave the wallet.');
    }

    public function test_a_lifetime_membership_is_still_current_years_later(): void
    {
        $user = $this->member(100000);
        $plan = $this->plan(null);

        $this->postJson('/api/v1/me/membership/subscribe', ['membership_plan_id' => $plan->id])
            ->assertCreated();

        $this->travel(10)->years();
        Sanctum::actingAs($user->fresh());

        // `ends_at > now()` alone would report "no membership" here.
        $this->getJson('/api/v1/me/membership')
            ->assertOk()
            ->assertJsonPath('data.plan_code', $plan->code)
            ->assertJsonPath('data.ends_at', null);
    }

    public function test_a_plan_with_a_duration_still_expires_as_before(): void
    {
        $this->member(100000);
        $plan = $this->plan(30);

        $this->postJson('/api/v1/me/membership/subscribe', ['membership_plan_id' => $plan->id])
            ->assertCreated();

        $subscription = MembershipSubscription::sole();
        $this->assertNotNull($subscription->ends_at);
        $this->assertTrue(
            $subscription->ends_at->equalTo($subscription->starts_at->copy()->addDays(30)),
            'A finite plan must still end exactly duration_days after it starts.'
        );
    }

    public function test_renewing_a_finite_plan_stacks_onto_the_remaining_days(): void
    {
        $this->member(200000);
        $plan = $this->plan(30);

        $this->postJson('/api/v1/me/membership/subscribe', ['membership_plan_id' => $plan->id])
            ->assertCreated();
        $first = MembershipSubscription::latest('id')->first();

        $this->postJson('/api/v1/me/membership/subscribe', ['membership_plan_id' => $plan->id])
            ->assertCreated();
        $second = MembershipSubscription::latest('id')->first();

        // Renewing early must not cost the member days they already paid for.
        $this->assertTrue($second->starts_at->equalTo($first->ends_at));
    }

    public function test_it_refuses_a_purchase_the_wallet_cannot_cover(): void
    {
        $user = $this->member(1000);
        $plan = $this->plan(null);

        $this->postJson('/api/v1/me/membership/subscribe', ['membership_plan_id' => $plan->id])
            ->assertStatus(400);

        $this->assertSame(0, MembershipSubscription::count());
        $this->assertSame($this->roles['member'], $user->fresh()->role_id);
        $this->assertSame(1000, (int) $user->fresh()->balance);
    }
}
