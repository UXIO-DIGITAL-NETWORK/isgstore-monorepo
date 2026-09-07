<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class IntegrationChannelsTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
    }

    public function test_integration_channels_require_authentication(): void
    {
        $this->getJson('/api/v1/integration/channels')->assertUnauthorized();
    }

    public function test_reports_connected_channels(): void
    {
        $this->actingAsAdmin();
        Supplier::factory()->create(['name' => 'Uxiolabs']);
        Http::fake([
            '*/saldo' => Http::response(['status' => true, 'msg' => 'berhasil', 'data' => ['saldo' => 250000]], 200),
            '*/v1.0.0/balance' => Http::response([
                'code' => 0,
                'messgae' => 'success',
                'data' => ['current_balance' => '750000', 'current_freeze' => '0'],
            ], 200),
        ]);

        $response = $this->getJson('/api/v1/integration/channels')->assertOk();
        $channels = collect($response->json('data'))->keyBy('id');

        // Uxiolabs (supplier) still exposes its balance.
        $this->assertSame('supplier', $channels['uxiolabs']['type']);
        $this->assertSame('connected', $channels['uxiolabs']['connection_status']);
        $this->assertEquals(250000, $channels['uxiolabs']['balance']);

        // A payment gateway's balance is deliberately hidden — only the
        // connected status is reported, even though the probe succeeded.
        $this->assertSame('payment_gateway', $channels['monetapay']['type']);
        $this->assertSame('connected', $channels['monetapay']['connection_status']);
        $this->assertNull($channels['monetapay']['balance']);
    }

    public function test_reports_disconnected_when_the_upstream_call_fails(): void
    {
        $this->actingAsAdmin();
        Supplier::factory()->create(['name' => 'Uxiolabs']);
        Http::fake([
            '*/saldo' => Http::response(['message' => 'error'], 500),
            '*/v1.0.0/balance' => Http::response(['message' => 'error'], 500),
        ]);

        $response = $this->getJson('/api/v1/integration/channels')->assertOk();
        $channels = collect($response->json('data'))->keyBy('id');

        $this->assertSame('disconnected', $channels['uxiolabs']['connection_status']);
        $this->assertNull($channels['uxiolabs']['balance']);
        $this->assertSame('disconnected', $channels['monetapay']['connection_status']);
        $this->assertNull($channels['monetapay']['balance']);
    }

    public function test_omits_uxiolabs_channel_when_no_such_supplier_is_configured(): void
    {
        $this->actingAsAdmin();
        Http::fake(['*/v1.0.0/balance' => Http::response(['balanceInfos' => []], 200)]);

        $response = $this->getJson('/api/v1/integration/channels')->assertOk();
        $channels = collect($response->json('data'))->keyBy('id');

        $this->assertArrayNotHasKey('uxiolabs', $channels);
        $this->assertArrayHasKey('monetapay', $channels);
    }
}
