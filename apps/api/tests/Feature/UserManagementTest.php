<?php

namespace Tests\Feature;

use App\Models\BalanceMutation;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
    }

    private function member(array $overrides = []): User
    {
        $role = Role::factory()->create(['name' => 'Member']);

        return User::factory()->create(array_merge(['role_id' => $role->id], $overrides));
    }

    public function test_status_change_requires_admin(): void
    {
        $user = $this->member();

        $this->postJson("/api/v1/users/{$user->id}/status", ['status' => 'suspended'])
            ->assertUnauthorized();
    }

    public function test_admin_can_suspend_a_user(): void
    {
        $this->actingAsAdmin();
        $user = $this->member(['status' => 'active']);

        $this->postJson("/api/v1/users/{$user->id}/status", ['status' => 'suspended'])
            ->assertOk()
            ->assertJsonPath('data.status', 'suspended');

        $this->assertSame('suspended', $user->fresh()->status);
    }

    public function test_status_rejects_an_unknown_value(): void
    {
        $this->actingAsAdmin();
        $user = $this->member();

        $this->postJson("/api/v1/users/{$user->id}/status", ['status' => 'frozen'])
            ->assertUnprocessable();
    }

    public function test_admin_credit_increases_the_balance_and_records_a_mutation(): void
    {
        $this->actingAsAdmin();
        $user = $this->member(['balance' => 1000]);

        $this->postJson("/api/v1/users/{$user->id}/balance-adjustments", [
            'amount' => 5000,
            'direction' => 'credit',
            'reason' => 'Compensation for failed order',
        ])->assertOk()->assertJsonPath('data.balance', 6000);

        $this->assertSame(6000, (int) $user->fresh()->balance);
        $this->assertSame(1, BalanceMutation::where('user_id', $user->id)->count());
    }

    public function test_admin_debit_decreases_the_balance(): void
    {
        $this->actingAsAdmin();
        $user = $this->member(['balance' => 5000]);

        $this->postJson("/api/v1/users/{$user->id}/balance-adjustments", [
            'amount' => 2000,
            'direction' => 'debit',
            'reason' => 'Reversal',
        ])->assertOk()->assertJsonPath('data.balance', 3000);
    }

    public function test_balance_adjustment_requires_a_reason(): void
    {
        $this->actingAsAdmin();
        $user = $this->member();

        $this->postJson("/api/v1/users/{$user->id}/balance-adjustments", [
            'amount' => 1000,
            'direction' => 'credit',
        ])->assertUnprocessable();
    }

    public function test_role_filter_returns_only_admin_accounts(): void
    {
        $adminRole = Role::factory()->create(['name' => 'Admin']);
        $admin = User::factory()->create(['role_id' => $adminRole->id, 'name' => 'Super Admin']);
        Sanctum::actingAs($admin, ['access-api']);

        $this->member(['name' => 'Client Merchant']);
        Role::factory()->create(['name' => 'Payment-Internal']);
        $this->member(['name' => 'Internal Finance']);

        $response = $this->getJson('/api/v1/users?role=admin')->assertOk();

        $response->assertJsonCount(1, 'data.data');
        $response->assertJsonPath('data.data.0.name', 'Super Admin');
    }
}
