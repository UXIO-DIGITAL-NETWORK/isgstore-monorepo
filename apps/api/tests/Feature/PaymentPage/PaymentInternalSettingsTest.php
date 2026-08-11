<?php

namespace Tests\Feature\PaymentPage;

use App\Models\PaymentChannel;
use App\Models\Role;
use App\Models\User;
use App\Support\Pricing\AdminFeeSetting;
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

    public function test_internal_sets_global_admin_fee(): void
    {
        Sanctum::actingAs($this->internal());

        $this->putJson('/api/v1/payment-internal/settings/admin-fee', ['type' => 'percent', 'value' => 5])
            ->assertOk()
            ->assertJsonPath('data.type', 'percent')
            ->assertJsonPath('data.value', 5);

        $this->assertSame(['type' => 'percent', 'value' => 5], AdminFeeSetting::current());
    }

    public function test_admin_fee_percent_cannot_exceed_100(): void
    {
        Sanctum::actingAs($this->internal());

        $this->putJson('/api/v1/payment-internal/settings/admin-fee', ['type' => 'percent', 'value' => 150])
            ->assertStatus(422);
    }

    public function test_internal_updates_channel_fee(): void
    {
        $channel = PaymentChannel::factory()->create(['fee_flat' => 0, 'fee_percent' => 0]);
        Sanctum::actingAs($this->internal());

        $this->putJson("/api/v1/payment-internal/channels/{$channel->id}", ['fee_flat' => 2500, 'is_active' => true])
            ->assertOk()
            ->assertJsonPath('data.fee_flat', 2500);

        $this->assertSame(2500, (int) $channel->fresh()->fee_flat);
    }

    public function test_merchant_cannot_touch_settings(): void
    {
        Sanctum::actingAs($this->merchant());

        $this->getJson('/api/v1/payment-internal/channels')->assertStatus(403);
        $this->putJson('/api/v1/payment-internal/settings/admin-fee', ['type' => 'fixed', 'value' => 1000])
            ->assertStatus(403);
    }

    public function test_admin_fee_setting_helper_computes_markup(): void
    {
        AdminFeeSetting::save('percent', 10);
        $this->assertSame(6000, AdminFeeSetting::compute(60000));

        AdminFeeSetting::save('fixed', 3000);
        $this->assertSame(3000, AdminFeeSetting::compute(60000));
    }
}
