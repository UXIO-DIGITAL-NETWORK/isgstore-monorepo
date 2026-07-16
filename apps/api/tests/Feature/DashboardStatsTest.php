<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardStatsTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    public function test_dashboard_stats_require_authentication(): void
    {
        $this->getJson('/api/v1/dashboard/stats')->assertUnauthorized();
    }

    public function test_dashboard_stats_returns_zeros_on_empty_database(): void
    {
        $this->actingAsAdmin();

        $this->getJson('/api/v1/dashboard/stats')
            ->assertOk()
            ->assertJsonPath('data.totals.transactions', 0)
            ->assertJsonPath('data.periods.today.revenue', 0)
            ->assertJsonPath('data.periods.all_time.count', 0)
            ->assertJsonPath('data.periods.all_time.by_status.COMPLETED', 0)
            ->assertJsonPath('data.chart', [])
            ->assertJsonPath('data.recent_transactions', []);
    }

    public function test_dashboard_stats_aggregates_per_window(): void
    {
        $this->actingAsAdmin();

        // 2 COMPLETED today (revenue counts), 1 PENDING today, 1 COMPLETED last month
        Transaction::factory()->count(2)->create([
            'status' => 'COMPLETED',
            'amount_total' => 12000,
            'margin' => 2000,
        ]);
        Transaction::factory()->create(['status' => 'PENDING']);
        Transaction::factory()->create([
            'status' => 'COMPLETED',
            'amount_total' => 50000,
            'margin' => 5000,
            'created_at' => now()->subMonths(2),
        ]);

        $response = $this->getJson('/api/v1/dashboard/stats')->assertOk();

        $response
            ->assertJsonPath('data.periods.today.revenue', 24000)
            ->assertJsonPath('data.periods.today.margin', 4000)
            ->assertJsonPath('data.periods.today.count', 3)
            ->assertJsonPath('data.periods.today.by_status.COMPLETED', 2)
            ->assertJsonPath('data.periods.today.by_status.PENDING', 1)
            ->assertJsonPath('data.periods.all_time.revenue', 74000)
            ->assertJsonPath('data.periods.all_time.count', 4)
            ->assertJsonPath('data.totals.transactions', 4)
            ->assertJsonPath('data.totals.users', 1);

        $this->assertCount(4, $response->json('data.recent_transactions'));
        $this->assertNotEmpty($response->json('data.chart'));
        // Old transaction is outside the 30-day chart window
        $this->assertSame(
            3,
            collect($response->json('data.chart'))->sum('transactions')
        );
    }

    public function test_dashboard_stats_includes_stat_cards_and_pending_orders(): void
    {
        $this->actingAsAdmin();

        Transaction::factory()->create(['status' => 'PENDING']);
        Transaction::factory()->create(['status' => 'PROCESSING']);
        Transaction::factory()->create(['status' => 'FAILED_PROVIDER']);
        Transaction::factory()->create(['status' => 'PENDING', 'is_manual' => true]);

        $response = $this->getJson('/api/v1/dashboard/stats')->assertOk();

        $statCardKeys = collect($response->json('data.stat_cards'))->pluck('key');
        $this->assertSame(['credit', 'debit', 'todays_sales'], $statCardKeys->all());

        $response
            ->assertJsonPath('data.pending_orders.manual_orders', 1)
            ->assertJsonPath('data.pending_orders.pending_payment', 2)
            ->assertJsonPath('data.pending_orders.processing', 1)
            ->assertJsonPath('data.pending_orders.failed_transaction', 1);
    }
}
