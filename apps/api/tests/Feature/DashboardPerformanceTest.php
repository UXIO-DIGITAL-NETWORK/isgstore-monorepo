<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardPerformanceTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    public function test_dashboard_performance_requires_authentication(): void
    {
        $this->getJson('/api/v1/dashboard/performance?tab=category')->assertUnauthorized();
    }

    public function test_dashboard_performance_rejects_an_unknown_tab(): void
    {
        $this->actingAsAdmin();

        $this->getJson('/api/v1/dashboard/performance?tab=bogus')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['tab']);
    }

    public function test_category_tab_ranks_by_completed_revenue(): void
    {
        $this->actingAsAdmin();

        $topCategory = Category::factory()->create(['name' => 'Mobile Legends']);
        $lowCategory = Category::factory()->create(['name' => 'PUBG Mobile']);
        $topProduct = Product::factory()->create(['category_id' => $topCategory->id]);
        $lowProduct = Product::factory()->create(['category_id' => $lowCategory->id]);

        Transaction::factory()->create(['product_id' => $topProduct->id, 'status' => 'COMPLETED', 'amount_total' => 100000]);
        Transaction::factory()->create(['product_id' => $lowProduct->id, 'status' => 'COMPLETED', 'amount_total' => 10000]);
        // Pending transaction counts toward total_transaction but not revenue.
        Transaction::factory()->create(['product_id' => $lowProduct->id, 'status' => 'PENDING', 'amount_total' => 99999]);

        $response = $this->getJson('/api/v1/dashboard/performance?tab=category')->assertOk();

        $response
            ->assertJsonPath('data.0.name', 'Mobile Legends')
            ->assertJsonPath('data.0.revenue', 100000)
            ->assertJsonPath('data.0.total_transaction', 1)
            ->assertJsonPath('data.1.name', 'PUBG Mobile')
            ->assertJsonPath('data.1.revenue', 10000)
            ->assertJsonPath('data.1.total_transaction', 2);
    }

    public function test_user_tab_excludes_guest_checkouts(): void
    {
        $this->actingAsAdmin();

        // Explicit role: UserFactory's default role_id (random 1-5) assumes
        // roles already exist, which isn't guaranteed in an isolated test transaction.
        $memberRole = Role::factory()->create(['name' => 'Member']);
        $user = User::factory()->create(['name' => 'Dimas Sufyan', 'role_id' => $memberRole->id]);
        Transaction::factory()->create(['user_id' => $user->id, 'status' => 'COMPLETED', 'amount_total' => 50000]);
        Transaction::factory()->create(['user_id' => null, 'status' => 'COMPLETED', 'amount_total' => 999999]);

        $response = $this->getJson('/api/v1/dashboard/performance?tab=user')->assertOk();

        $response->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Dimas Sufyan');
    }
}
