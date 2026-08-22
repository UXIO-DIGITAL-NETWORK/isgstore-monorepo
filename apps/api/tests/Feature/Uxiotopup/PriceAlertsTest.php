<?php

namespace Tests\Feature\Uxiotopup;

use App\Enums\PriceAlertStatus;
use App\Models\PriceChangeAlert;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PriceAlertsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        $this->admin = User::factory()->create(['role_id' => $role->id]);
        Sanctum::actingAs($this->admin);
    }

    public function test_price_alerts_require_authentication(): void
    {
        $this->getJson('/api/v1/uxiotopup/price-alerts')->assertUnauthorized();
    }

    public function test_list_returns_paginated_alerts_with_product_relation(): void
    {
        $this->actingAsAdmin();
        PriceChangeAlert::factory()->count(3)->create();

        $this->getJson('/api/v1/uxiotopup/price-alerts')
            ->assertOk()
            ->assertJsonCount(3, 'data.data')
            ->assertJsonPath('data.meta.total', 3)
            ->assertJsonStructure(['data' => ['data' => [
                ['id', 'buyer_sku_code', 'old_price', 'new_price', 'status', 'supplier_product' => ['product']],
            ]]]);
    }

    public function test_list_filters_by_status(): void
    {
        $this->actingAsAdmin();
        PriceChangeAlert::factory()->count(2)->create();
        PriceChangeAlert::factory()->acknowledged()->create();

        $this->getJson('/api/v1/uxiotopup/price-alerts?status=pending')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 2);

        $this->getJson('/api/v1/uxiotopup/price-alerts?status=acknowledged')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_acknowledge_marks_alert_done_with_user_and_is_idempotent(): void
    {
        $this->actingAsAdmin();
        $alert = PriceChangeAlert::factory()->create();

        $this->postJson("/api/v1/uxiotopup/price-alerts/{$alert->id}/acknowledge")
            ->assertOk()
            ->assertJsonPath('data.status', 'acknowledged');

        $alert->refresh();
        $this->assertSame(PriceAlertStatus::ACKNOWLEDGED, $alert->status);
        $this->assertSame($this->admin->id, (int) $alert->acknowledged_by);
        $this->assertNotNull($alert->acknowledged_at);

        // Second acknowledge is a no-op, not an error
        $this->postJson("/api/v1/uxiotopup/price-alerts/{$alert->id}/acknowledge")->assertOk();
    }

    public function test_acknowledge_all_clears_every_pending_alert(): void
    {
        $this->actingAsAdmin();
        PriceChangeAlert::factory()->count(3)->create();
        PriceChangeAlert::factory()->acknowledged()->create();

        $this->postJson('/api/v1/uxiotopup/price-alerts/acknowledge-all')
            ->assertOk()
            ->assertJsonPath('data.acknowledged', 3);

        $this->assertSame(
            0,
            PriceChangeAlert::where('status', PriceAlertStatus::PENDING->value)->count()
        );
    }
}
