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
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    public function test_integration_channels_require_authentication(): void
    {
        $this->getJson('/api/v1/integration/channels')->assertUnauthorized();
    }

    public function test_reports_connected_channels_with_balances(): void
    {
        $this->actingAsAdmin();
        Supplier::factory()->create(['name' => 'Digiflazz']);
        Http::fake([
            '*/cek-saldo' => Http::response(['data' => ['deposit' => 250000]], 200),
            '*/v1.0.0/balance' => Http::response([
                'balanceInfos' => [['balanceType' => 'AVAILABLE', 'amount' => ['value' => '750000']]],
            ], 200),
        ]);

        $response = $this->getJson('/api/v1/integration/channels')->assertOk();
        $channels = collect($response->json('data'))->keyBy('id');

        $this->assertSame('supplier', $channels['digiflazz']['type']);
        $this->assertSame('connected', $channels['digiflazz']['connection_status']);
        $this->assertEquals(250000, $channels['digiflazz']['balance']);

        $this->assertSame('payment_gateway', $channels['monetapay']['type']);
        $this->assertSame('connected', $channels['monetapay']['connection_status']);
        $this->assertEquals(750000, $channels['monetapay']['balance']);
    }

    public function test_reports_disconnected_when_the_upstream_call_fails(): void
    {
        $this->actingAsAdmin();
        Supplier::factory()->create(['name' => 'Digiflazz']);
        Http::fake([
            '*/cek-saldo' => Http::response(['message' => 'error'], 500),
            '*/v1.0.0/balance' => Http::response(['message' => 'error'], 500),
        ]);

        $response = $this->getJson('/api/v1/integration/channels')->assertOk();
        $channels = collect($response->json('data'))->keyBy('id');

        $this->assertSame('disconnected', $channels['digiflazz']['connection_status']);
        $this->assertNull($channels['digiflazz']['balance']);
        $this->assertSame('disconnected', $channels['monetapay']['connection_status']);
        $this->assertNull($channels['monetapay']['balance']);
    }

    public function test_omits_digiflazz_channel_when_no_such_supplier_is_configured(): void
    {
        $this->actingAsAdmin();
        Http::fake(['*/v1.0.0/balance' => Http::response(['balanceInfos' => []], 200)]);

        $response = $this->getJson('/api/v1/integration/channels')->assertOk();
        $channels = collect($response->json('data'))->keyBy('id');

        $this->assertArrayNotHasKey('digiflazz', $channels);
        $this->assertArrayHasKey('monetapay', $channels);
    }
}
