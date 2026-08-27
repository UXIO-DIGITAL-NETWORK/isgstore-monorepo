<?php

declare(strict_types=1);

namespace Tests\Feature\Hub;

use App\Models\PaymentChannel;
use App\Models\Role;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Once the Hub owns the catalog and the fee schedule, the site's own panel is
 * a viewer for them: a local edit would be silently overwritten by the next
 * sync, which reads as a bug nobody can reproduce. `is_active` on channels
 * stays local — which channels a site offers is that site's own call.
 * A standalone deployment (hub disabled) keeps the full write surface.
 */
class HubManagedGuardTest extends TestCase
{
    use RefreshDatabase;

    private function internal(): User
    {
        return User::factory()->create([
            'role_id' => Role::firstOrCreate(['name' => 'Payment-Internal'])->id,
        ]);
    }

    private function servicePayload(): array
    {
        return [
            'code' => 'domain', 'name' => 'Domain', 'category' => 'infrastructure',
            'cost_price' => 100000, 'selling_price' => 200000, 'duration_days' => 365,
        ];
    }

    public function test_catalog_writes_are_refused_when_hub_managed(): void
    {
        config(['services.hub.enabled' => true, 'services.hub.managed_catalog' => true]);
        Sanctum::actingAs($this->internal());

        $this->postJson('/api/v1/payment-internal/services', $this->servicePayload())
            ->assertStatus(422);

        $service = Service::create($this->servicePayload());
        $this->putJson("/api/v1/payment-internal/services/{$service->id}", ['name' => 'X'])
            ->assertStatus(422);
        $this->deleteJson("/api/v1/payment-internal/services/{$service->id}")
            ->assertStatus(422);

        // Reads stay open — the panel is a viewer, not gone.
        $this->getJson('/api/v1/payment-internal/services')->assertOk();
    }

    public function test_catalog_meta_reports_hub_managed_state(): void
    {
        Sanctum::actingAs($this->internal());

        config(['services.hub.enabled' => true, 'services.hub.managed_catalog' => true]);
        $this->getJson('/api/v1/payment-internal/services/meta')
            ->assertOk()
            ->assertJsonPath('data.hub_managed', true)
            ->assertJsonPath('data.managed_note', fn ($note) => is_string($note) && $note !== '');

        config(['services.hub.enabled' => false]);
        $this->getJson('/api/v1/payment-internal/services/meta')
            ->assertOk()
            ->assertJsonPath('data.hub_managed', false)
            ->assertJsonPath('data.managed_note', null);
    }

    public function test_catalog_writes_work_on_a_standalone_deployment(): void
    {
        config(['services.hub.enabled' => false]);
        Sanctum::actingAs($this->internal());

        $this->postJson('/api/v1/payment-internal/services', $this->servicePayload())
            ->assertCreated();
    }

    public function test_channel_edits_are_fully_refused_when_hub_managed(): void
    {
        config(['services.hub.enabled' => true, 'services.hub.managed_channels' => true]);
        $channel = PaymentChannel::factory()->create(['channel_code' => 'qris', 'is_active' => true]);
        Sanctum::actingAs($this->internal());

        // The Hub now owns fees, is_active AND min_amount per site — the local
        // editor is read-only, so every field is refused.
        $this->putJson("/api/v1/payment-internal/channels/{$channel->id}", ['fee_percent' => 2])
            ->assertStatus(422);
        $this->putJson("/api/v1/payment-internal/channels/{$channel->id}", ['is_active' => false])
            ->assertStatus(422);
        $this->assertTrue((bool) $channel->fresh()->is_active); // unchanged

        // Reads stay open — the panel is a viewer.
        $this->getJson('/api/v1/payment-internal/channels')->assertOk();
    }

    public function test_channel_fee_edits_work_on_a_standalone_deployment(): void
    {
        config(['services.hub.enabled' => false]);
        $channel = PaymentChannel::factory()->create(['channel_code' => 'qris', 'fee_percent' => 0.7]);
        Sanctum::actingAs($this->internal());

        $this->putJson("/api/v1/payment-internal/channels/{$channel->id}", ['fee_percent' => 0.9])
            ->assertOk();
        $this->assertSame(0.9, (float) $channel->fresh()->fee_percent);
    }
}
