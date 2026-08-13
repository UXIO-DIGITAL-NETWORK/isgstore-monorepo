<?php

namespace Tests\Feature\Integration;

use App\Models\IntegrationCredential;
use App\Models\Role;
use App\Models\User;
use App\Services\Payment\MonetapayService;
use App\Support\Integration\IntegrationConfig;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Tests\TestCase;

class IntegrationChannelTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    /** Make Monetapay's balance inquiry return the real 5.1 shape. */
    private function fakeMonetapayBalance(array $data = ['current_balance' => '1500000.00', 'current_freeze' => '0']): void
    {
        $this->mock(MonetapayService::class, function ($mock) use ($data) {
            $mock->shouldReceive('inquiryBalanceCached')->andReturn([
                'code' => 0,
                'messgae' => 'success',
                'data' => $data,
            ]);
        });
    }

    public function test_channels_report_monetapay_connected_with_parsed_balance(): void
    {
        $this->fakeMonetapayBalance();
        $this->actingAsAdmin();

        $monetapay = collect($this->getJson('/api/v1/integration/channels')->assertOk()->json('data'))
            ->firstWhere('id', 'monetapay');

        $this->assertSame('connected', $monetapay['connection_status']);
        $this->assertSame(1500000.0, (float) $monetapay['balance']);
    }

    public function test_update_persists_secret_encrypted_and_returns_it_masked(): void
    {
        $this->fakeMonetapayBalance();
        $this->actingAsAdmin();

        $response = $this->putJson('/api/v1/integration/channels/monetapay', [
            'collection_app_id' => 'APP-123',
            'token' => 'SUPERSECRET9876',
        ])->assertOk();

        $fields = collect($response->json('data.fields'));
        $this->assertSame('••••9876', $fields->firstWhere('key', 'token')['value']);
        $this->assertSame('APP-123', $fields->firstWhere('key', 'collection_app_id')['value']);

        // Stored (decrypted via cast) holds the real secret; the raw DB column is ciphertext.
        $this->assertSame('SUPERSECRET9876', IntegrationConfig::stored('monetapay')['token']);
        $rawColumn = DB::table('integration_credentials')
            ->where('provider', 'monetapay')->value('credentials');
        $this->assertStringNotContainsString('SUPERSECRET9876', (string) $rawColumn);
    }

    public function test_secret_is_write_only_blank_keeps_existing(): void
    {
        $this->fakeMonetapayBalance();
        $this->actingAsAdmin();

        $this->putJson('/api/v1/integration/channels/monetapay', ['token' => 'FIRSTTOKEN1111'])->assertOk();
        // Second update omits token → must keep the first one.
        $this->putJson('/api/v1/integration/channels/monetapay', ['collection_app_id' => 'APP-9'])->assertOk();

        $this->assertSame('FIRSTTOKEN1111', IntegrationConfig::stored('monetapay')['token']);
        $this->assertSame('APP-9', IntegrationConfig::stored('monetapay')['collection_app_id']);
    }

    public function test_resolver_prefers_db_then_falls_back_to_env(): void
    {
        config(['services.monetapay.token' => 'ENV-TOKEN']);

        $this->assertSame('ENV-TOKEN', IntegrationConfig::for('monetapay')['token']);

        IntegrationCredential::create(['provider' => 'monetapay', 'credentials' => ['token' => 'DB-TOKEN']]);
        $this->assertSame('DB-TOKEN', IntegrationConfig::for('monetapay')['token']);
    }

    public function test_show_and_ping_reject_unknown_provider(): void
    {
        $this->actingAsAdmin();
        $this->getJson('/api/v1/integration/channels/unknown')->assertStatus(404);
        $this->postJson('/api/v1/integration/channels/unknown/ping')->assertStatus(404);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
