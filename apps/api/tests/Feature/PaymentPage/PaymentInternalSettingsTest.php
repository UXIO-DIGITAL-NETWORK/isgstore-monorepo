<?php

namespace Tests\Feature\PaymentPage;

use App\Models\PaymentChannel;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaymentInternalSettingsTest extends TestCase
{
    use RefreshDatabase;

    private function internal(): User
    {
        $role = Role::firstOrCreate(['name' => 'Payment-Internal']);

        return User::factory()->create(['role_id' => $role->id]);
    }

    private function merchant(): User
    {
        $role = Role::firstOrCreate(['name' => 'Payment-Admin']);

        return User::factory()->create(['role_id' => $role->id]);
    }

    public function test_internal_updates_channel_fee(): void
    {
        $channel = PaymentChannel::factory()->create(['fee_flat' => 0, 'fee_percent' => 0]);
        Sanctum::actingAs($this->internal());

        $this->putJson("/api/v1/payment-internal/channels/{$channel->id}", [
            'fee_flat' => 2500,
            'gateway_fee_flat' => 1900,
            'is_active' => true,
        ])
            ->assertOk()
            ->assertJsonPath('data.fee_flat', 2500)
            ->assertJsonPath('data.gateway_fee_flat', 1900);

        $this->assertSame(2500, (int) $channel->fresh()->fee_flat);
        $this->assertSame(1900, (int) $channel->fresh()->gateway_fee_flat);
    }

    public function test_merchant_cannot_touch_settings(): void
    {
        $channel = PaymentChannel::factory()->create();
        Sanctum::actingAs($this->merchant());

        $this->getJson('/api/v1/payment-internal/channels')->assertStatus(403);
        $this->putJson("/api/v1/payment-internal/channels/{$channel->id}", ['fee_flat' => 1000])
            ->assertStatus(403);
    }

    /**
     * The channel's own fee is now the only admin fee, so the global markup
     * setting and its endpoints are gone rather than merely defaulting to 0.
     */
    public function test_admin_fee_settings_route_is_gone(): void
    {
        Sanctum::actingAs($this->internal());

        $this->getJson('/api/v1/payment-internal/settings/admin-fee')->assertStatus(404);
        $this->putJson('/api/v1/payment-internal/settings/admin-fee', ['type' => 'fixed', 'value' => 1000])
            ->assertStatus(404);
    }
}
