<?php

namespace Tests\Feature;

use App\Enums\TransactionStatus;
use App\Models\BalanceMutation;
use App\Models\MembershipPlan;
use App\Models\MembershipSubscription;
use App\Models\PointLedgerEntry;
use App\Models\RefundRequest;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The admin user-detail read side.
 *
 * The list page already carries the profile; these are what a detail page needs
 * on top — aggregates, and the threads that hang off one account. Every one is
 * admin-gated like the rest of the user routes, and every read is scoped to the
 * account in the path.
 */
class UserDetailTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
    }

    private function member(string $name = 'Randy Galang', array $overrides = []): User
    {
        $role = Role::factory()->create(['name' => 'Member']);

        return User::factory()->create(array_merge(['role_id' => $role->id, 'name' => $name], $overrides));
    }

    public function test_the_detail_reads_all_need_an_admin(): void
    {
        $user = $this->member();

        $this->getJson("/api/v1/users/{$user->id}/overview")->assertUnauthorized();
        $this->getJson("/api/v1/users/{$user->id}/balance-mutations")->assertUnauthorized();
        $this->getJson("/api/v1/users/{$user->id}/point-history")->assertUnauthorized();
        $this->getJson("/api/v1/users/{$user->id}/refunds")->assertUnauthorized();
    }

    public function test_overview_carries_the_profile_aggregates_and_membership(): void
    {
        $this->actingAsAdmin();
        $user = $this->member(overrides: ['balance' => 250000, 'point' => 42]);

        Transaction::factory()->count(2)->create([
            'user_id' => $user->id,
            'status' => TransactionStatus::COMPLETED,
            'amount_total' => 150000,
        ]);
        // Not settled — it must NOT read as spend.
        Transaction::factory()->create([
            'user_id' => $user->id,
            'status' => TransactionStatus::PENDING,
            'amount_total' => 999000,
        ]);

        $vipRole = Role::factory()->create(['name' => 'VIP']);
        $plan = MembershipPlan::create([
            'code' => 'vip-'.uniqid(),
            'name' => ['id' => 'VIP'],
            'benefits' => ['id' => []],
            'price' => 50000,
            'duration_days' => 30,
            'role_id' => $vipRole->id,
            'is_active' => true,
        ]);
        MembershipSubscription::create([
            'user_id' => $user->id,
            'membership_plan_id' => $plan->id,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addMonth(),
            'status' => 'active',
        ]);

        $data = $this->getJson("/api/v1/users/{$user->id}/overview")->assertOk()->json('data');

        $this->assertSame((int) $user->id, (int) $data['user']['id']);
        $this->assertSame(3, $data['stats']['transactions_count']);
        // 300.000, not 1.299.000 — the PENDING order is not money spent.
        $this->assertSame(300000, $data['stats']['total_spent']);
        $this->assertSame(0, $data['stats']['refunds_count']);
        $this->assertSame('VIP', $data['membership']['plan']);
        $this->assertFalse($data['membership']['lifetime']);
    }

    public function test_overview_reports_no_membership_rather_than_a_guess(): void
    {
        $this->actingAsAdmin();
        $user = $this->member();

        $data = $this->getJson("/api/v1/users/{$user->id}/overview")->assertOk()->json('data');

        $this->assertNull($data['membership']);
    }

    public function test_balance_mutations_are_scoped_to_the_account(): void
    {
        $this->actingAsAdmin();
        $user = $this->member();
        $other = $this->member('Someone Else');

        BalanceMutation::create([
            'user_id' => $user->id, 'type' => 'topup', 'amount' => 1000,
            'balance_before' => 0, 'balance_after' => 1000, 'reference' => 'TOP-A',
        ]);
        BalanceMutation::create([
            'user_id' => $other->id, 'type' => 'topup', 'amount' => 2000,
            'balance_before' => 0, 'balance_after' => 2000, 'reference' => 'TOP-B',
        ]);

        $rows = $this->getJson("/api/v1/users/{$user->id}/balance-mutations")->assertOk()->json('data.data');

        $this->assertCount(1, $rows);
        $this->assertSame(1000, $rows[0]['amount']);
        $this->assertSame('TOP-A', $rows[0]['reference']);
    }

    public function test_point_history_is_scoped_to_the_account(): void
    {
        $this->actingAsAdmin();
        $user = $this->member();
        $other = $this->member('Someone Else');

        PointLedgerEntry::create([
            'user_id' => $user->id, 'type' => 'earn', 'amount' => 10,
            'points_before' => 0, 'points_after' => 10, 'reference' => 'PT-A',
        ]);
        PointLedgerEntry::create([
            'user_id' => $other->id, 'type' => 'earn', 'amount' => 20,
            'points_before' => 0, 'points_after' => 20, 'reference' => 'PT-B',
        ]);

        $rows = $this->getJson("/api/v1/users/{$user->id}/point-history")->assertOk()->json('data.data');

        $this->assertCount(1, $rows);
        $this->assertSame(10, $rows[0]['amount']);
        $this->assertSame('PT-A', $rows[0]['reference']);
    }

    /**
     * A refund touches an account as the buyer OR as the claimant: a guest claim
     * never rewrites `transactions.user_id`, so the claim is the only thread back
     * to the person who was refunded.
     */
    public function test_refunds_cover_the_buyer_and_the_claimant(): void
    {
        $this->actingAsAdmin();
        $user = $this->member();
        $other = $this->member('Someone Else');

        RefundRequest::factory()->create(['user_id' => $user->id]);
        RefundRequest::factory()->create(['user_id' => $other->id, 'claimed_user_id' => $user->id]);
        // Nothing to do with this account.
        RefundRequest::factory()->create(['user_id' => $other->id]);

        $rows = $this->getJson("/api/v1/users/{$user->id}/refunds")->assertOk()->json('data.data');

        $this->assertCount(2, $rows);
    }
}
