<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportSummaryTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    public function test_summary_requires_admin(): void
    {
        $this->getJson('/api/v1/reports/summary')->assertUnauthorized();
    }

    public function test_summary_aggregates_completed_revenue_transactions_and_profit(): void
    {
        $this->actingAsAdmin();
        $product = Product::factory()->create(['name' => 'Free Fire 100 Diamonds']);
        Transaction::factory()->count(3)->create([
            'product_id' => $product->id,
            'status' => 'COMPLETED',
            'amount_total' => 10000,
            'margin' => 1500,
        ]);
        Transaction::factory()->create(['status' => 'PENDING', 'amount_total' => 99999, 'margin' => 9999]);

        $this->getJson('/api/v1/reports/summary?period=daily')
            ->assertOk()
            ->assertJsonPath('data.total_revenue', 30000)
            ->assertJsonPath('data.total_transactions', 3)
            ->assertJsonPath('data.total_profit', 4500)
            ->assertJsonPath('data.breakdown.0.label', 'Free Fire 100 Diamonds');
    }
}
