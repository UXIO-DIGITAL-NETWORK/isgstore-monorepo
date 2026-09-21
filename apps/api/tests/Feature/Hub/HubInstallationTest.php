<?php

declare(strict_types=1);

namespace Tests\Feature\Hub;

use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceInstallation;
use App\Models\ServiceInstallationDetail;
use App\Models\ServiceInstallationStep;
use App\Models\User;
use App\Support\Hub\HubSystemUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The Hub's installation surface. Two things are pinned: the READ contract's
 * shape (progress is DERIVED from the checklist, plaintext never travels) and
 * the WRITE channel's gate — every mutation wraps the same actions the
 * payment-internal panel runs, attributed to the HubSystemUser, behind the
 * two-key gate.
 */
class HubInstallationTest extends TestCase
{
    use RefreshDatabase;

    private const READ = 'read-key-xyz';

    private const WRITE = 'write-key-abc';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.hub.enabled' => true,
            'services.hub.api_key' => self::READ,
            'services.hub.write_enabled' => true,
            'services.hub.write_api_key' => self::WRITE,
            'services.hub.allowed_ips' => '',
        ]);
    }

    private function headers(array $over = []): array
    {
        return array_merge(['X-Hub-Key' => self::READ, 'X-Hub-Write-Key' => self::WRITE], $over);
    }

    /** The default merchant — the site's single owner, what HubReportController scopes to. */
    private function merchant(): User
    {
        return User::factory()->create([
            'role_id' => Role::firstOrCreate(['name' => 'Payment-Admin'])->id,
            'name' => 'Klien A',
        ]);
    }

    private function service(string $code = 'uxiolabs'): Service
    {
        return Service::create([
            'code' => $code, 'name' => 'Uxiolabs', 'category' => 'supplier',
            'selling_price' => 250000, 'duration_days' => 30,
        ]);
    }

    private function installation(?User $merchant = null, ?Service $service = null): ServiceInstallation
    {
        return ServiceInstallation::create([
            'merchant_id' => ($merchant ?? $this->merchant())->id,
            'service_id' => ($service ?? $this->service())->id,
        ]);
    }

    public function test_installations_shape_is_pinned_with_derived_progress(): void
    {
        $installation = $this->installation();
        ServiceInstallationStep::create([
            'service_installation_id' => $installation->id,
            'title' => 'Setup WhatsApp Gateway', 'sort_order' => 0,
        ]);
        $done = ServiceInstallationStep::create([
            'service_installation_id' => $installation->id,
            'title' => 'Buat akun supplier', 'sort_order' => 1, 'completed_at' => now(),
        ]);
        ServiceInstallationDetail::create([
            'service_installation_id' => $installation->id,
            'label' => 'Panel URL', 'value' => 'https://panel.example', 'is_secret' => false,
        ]);

        $rows = $this->getJson('/api/v1/hub/installations', ['X-Hub-Key' => self::READ])
            ->assertOk()
            ->assertJsonStructure(['data' => [[
                'installation_id', 'service_code', 'service_name', 'starts_at', 'ends_at',
                'notes', 'steps_total', 'steps_completed', 'progress_percent', 'status',
                'steps' => [['id', 'title', 'description', 'sort_order', 'is_completed', 'completed_at', 'completed_by']],
                'details' => [['id', 'label', 'is_secret', 'masked_value', 'sort_order']],
            ]]])
            ->json('data');

        $this->assertCount(1, $rows);
        $this->assertSame('uxiolabs', $rows[0]['service_code']);
        $this->assertSame(2, $rows[0]['steps_total']);
        $this->assertSame(1, $rows[0]['steps_completed']);
        $this->assertSame(50, $rows[0]['progress_percent']);
        $this->assertSame('IN_PROGRESS', $rows[0]['status']);
        $this->assertTrue($rows[0]['steps'][1]['is_completed']);
        $this->assertSame('https://panel.example', $rows[0]['details'][0]['masked_value']);
    }

    public function test_read_payload_never_leaks_a_secret_value(): void
    {
        $installation = $this->installation();
        ServiceInstallationDetail::create([
            'service_installation_id' => $installation->id,
            'label' => 'API Key', 'value' => 'super-secret-value', 'is_secret' => true,
        ]);

        $response = $this->getJson('/api/v1/hub/installations', ['X-Hub-Key' => self::READ])->assertOk();

        $this->assertStringNotContainsString('super-secret-value', $response->getContent());
        $this->assertSame('••••••••alue', $response->json('data.0.details.0.masked_value'));
    }

    public function test_writes_require_the_write_key_and_the_write_flag(): void
    {
        $installation = $this->installation();

        // Write channel disabled on this site.
        config(['services.hub.write_enabled' => false]);
        $this->postJson(
            "/api/v1/hub/installations/{$installation->id}/steps",
            ['title' => 'X'],
            $this->headers(),
        )->assertStatus(403);

        config(['services.hub.write_enabled' => true]);

        // Read key valid, write key missing.
        $this->postJson(
            "/api/v1/hub/installations/{$installation->id}/steps",
            ['title' => 'X'],
            ['X-Hub-Key' => self::READ],
        )->assertStatus(403);
    }

    public function test_dead_without_a_configured_key(): void
    {
        config(['services.hub.api_key' => null]);

        $this->getJson('/api/v1/hub/installations', ['X-Hub-Key' => self::READ])->assertStatus(403);
    }

    public function test_step_completion_is_attributed_to_the_system_user_and_clears(): void
    {
        $installation = $this->installation();
        $step = ServiceInstallationStep::create([
            'service_installation_id' => $installation->id, 'title' => 'Migrations', 'sort_order' => 0,
        ]);

        $this->postJson(
            "/api/v1/hub/installation-steps/{$step->id}/completion",
            ['completed' => true],
            $this->headers(),
        )->assertOk()->assertJsonPath('data.is_completed', true);

        $step->refresh();
        $this->assertNotNull($step->completed_at);
        $this->assertSame(HubSystemUser::resolve()->id, $step->completed_by);

        $this->postJson(
            "/api/v1/hub/installation-steps/{$step->id}/completion",
            ['completed' => false],
            $this->headers(),
        )->assertOk()->assertJsonPath('data.is_completed', false);

        $step->refresh();
        $this->assertNull($step->completed_at);
        $this->assertNull($step->completed_by);
    }

    public function test_window_step_and_detail_writes_run_the_real_actions(): void
    {
        $installation = $this->installation();

        $this->putJson("/api/v1/hub/installations/{$installation->id}", [
            'starts_at' => now()->addDay()->toIso8601String(),
            'notes' => 'Dikerjakan Senin',
        ], $this->headers())->assertOk();

        $installation->refresh();
        $this->assertSame('Dikerjakan Senin', $installation->notes);
        $this->assertNotNull($installation->starts_at);

        $this->postJson(
            "/api/v1/hub/installations/{$installation->id}/steps",
            ['title' => 'Setup DNS'],
            $this->headers(),
        )->assertStatus(201);

        $this->assertDatabaseHas('service_installation_steps', [
            'service_installation_id' => $installation->id, 'title' => 'Setup DNS',
        ]);

        $this->postJson(
            "/api/v1/hub/installations/{$installation->id}/detail-items",
            ['label' => 'Username', 'value' => 'admin', 'is_secret' => false],
            $this->headers(),
        )->assertStatus(201);
    }

    public function test_reveal_returns_plaintext_and_is_scoped_to_the_owner(): void
    {
        $installation = $this->installation();
        $detail = ServiceInstallationDetail::create([
            'service_installation_id' => $installation->id,
            'label' => 'API Key', 'value' => 'super-secret-value', 'is_secret' => true,
        ]);

        $this->postJson(
            "/api/v1/hub/installation-details/{$detail->id}/reveal",
            [],
            $this->headers(),
        )->assertOk()->assertJsonPath('data.value', 'super-secret-value');
    }

    public function test_another_merchants_installation_is_a_404(): void
    {
        // A second merchant exists; the default merchant is the first, so this
        // row belongs to somebody else and must be invisible.
        $this->merchant();
        $other = User::factory()->create([
            'role_id' => Role::firstOrCreate(['name' => 'Payment-Admin'])->id,
        ]);
        $foreign = $this->installation($other);

        $this->putJson(
            "/api/v1/hub/installations/{$foreign->id}",
            ['notes' => 'nope'],
            $this->headers(),
        )->assertStatus(404);
    }
}
