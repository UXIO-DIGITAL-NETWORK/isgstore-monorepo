<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
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

    /**
     * The supplier's name is stored data, and it has been renamed twice — the row
     * reads "Uxiotopup" now. This card is matched on that name, so a build that
     * knew only one spelling would drop the balance silently: an empty figure, no
     * error, nobody the wiser. Both have to keep working.
     */
    #[DataProvider('supplierNames')]
    public function test_the_supplier_channel_survives_the_rename(string $supplierName): void
    {
        $this->actingAsAdmin();
        Supplier::factory()->create(['name' => $supplierName]);
        Http::fake([
            '*/saldo' => Http::response(['status' => true, 'msg' => 'berhasil', 'data' => ['saldo' => 250000]], 200),
            '*/v1.0.0/balance' => Http::response([
                'code' => 0,
                'messgae' => 'success',
                'data' => ['current_balance' => '750000', 'current_freeze' => '0'],
            ], 200),
        ]);

        $channels = collect($this->getJson('/api/v1/integration/channels')->assertOk()->json('data'))
            ->keyBy('id');

        $this->assertSame($supplierName, $channels['uxiolabs']['name']);
        $this->assertSame('connected', $channels['uxiolabs']['connection_status']);
        $this->assertEquals(250000, $channels['uxiolabs']['balance']);
    }

    /** @return array<string,array<int,string>> */
    public static function supplierNames(): array
    {
        return [
            'the current name' => ['Uxiotopup'],
            'the name it carried before the rename' => ['Uxiolabs'],
        ];
    }

    /**
     * The gateway is shown by what it is, not by whose API it happens to be:
     * "Payment Gateway" is the label the admin panel renders.
     */
    public function test_the_gateway_channel_is_labelled_generically(): void
    {
        $this->actingAsAdmin();
        Http::fake([
            '*/v1.0.0/balance' => Http::response([
                'code' => 0,
                'messgae' => 'success',
                'data' => ['current_balance' => '750000', 'current_freeze' => '0'],
            ], 200),
        ]);

        $channels = collect($this->getJson('/api/v1/integration/channels')->assertOk()->json('data'))
            ->keyBy('id');

        $this->assertSame('Payment Gateway', $channels['monetapay']['name']);
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
