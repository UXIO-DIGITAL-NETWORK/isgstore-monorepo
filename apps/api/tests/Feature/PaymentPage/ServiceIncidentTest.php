<?php

namespace Tests\Feature\PaymentPage;

use App\Models\PaymentChannel;
use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceIncident;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ServiceIncidentTest extends TestCase
{
    use RefreshDatabase;

    private function internal(): User
    {
        return User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Payment-Internal'])->id]);
    }

    private function merchant(): User
    {
        return User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Payment-Admin'])->id]);
    }

    private function payload(array $over = []): array
    {
        return array_merge([
            'title' => 'QRIS lambat',
            'severity' => 'MAJOR',
            'status' => 'INVESTIGATING',
            'message' => 'Settlement tertunda dari sisi provider.',
            'started_at' => now()->toIso8601String(),
        ], $over);
    }

    public function test_internal_publishes_an_incident_against_a_channel(): void
    {
        $channel = PaymentChannel::factory()->create(['name' => 'QRIS']);
        Sanctum::actingAs($this->internal());

        $this->postJson('/api/v1/payment-internal/incidents', $this->payload(['payment_channel_id' => $channel->id]))
            ->assertCreated()
            ->assertJsonPath('data.target.type', 'payment_channel')
            ->assertJsonPath('data.target.name', 'QRIS')
            ->assertJsonPath('data.severity', 'MAJOR');
    }

    /** Neither target means the status page cannot place the incident. */
    public function test_an_incident_needs_exactly_one_target(): void
    {
        $channel = PaymentChannel::factory()->create();
        $service = Service::factory()->create();
        Sanctum::actingAs($this->internal());

        $this->postJson('/api/v1/payment-internal/incidents', $this->payload())
            ->assertStatus(422)
            ->assertJsonValidationErrors('service_id');

        $this->postJson('/api/v1/payment-internal/incidents', $this->payload([
            'payment_channel_id' => $channel->id,
            'service_id' => $service->id,
        ]))->assertStatus(422)->assertJsonValidationErrors('service_id');
    }

    public function test_resolving_stamps_the_closing_time(): void
    {
        $incident = ServiceIncident::factory()->create([
            'payment_channel_id' => PaymentChannel::factory()->create()->id,
        ]);
        Sanctum::actingAs($this->internal());

        $this->putJson("/api/v1/payment-internal/incidents/{$incident->id}", ['status' => 'RESOLVED'])
            ->assertOk()
            ->assertJsonPath('data.status', 'RESOLVED');

        $this->assertNotNull($incident->fresh()->resolved_at);
    }

    public function test_client_status_page_reports_open_incidents_and_closed_channels(): void
    {
        $broken = PaymentChannel::factory()->create(['name' => 'QRIS', 'is_active' => true]);
        PaymentChannel::factory()->create(['name' => 'BNI VA', 'is_active' => false]);
        Service::factory()->create(['name' => 'Digiflazz', 'is_active' => true]);

        ServiceIncident::factory()->create([
            'title' => 'QRIS lambat',
            'payment_channel_id' => $broken->id,
            'severity' => 'MAJOR',
        ]);
        // A resolved incident must not keep a component degraded.
        ServiceIncident::factory()->resolved()->create([
            'payment_channel_id' => $broken->id,
        ]);

        Sanctum::actingAs($this->merchant());
        $response = $this->getJson('/api/v1/payment-admin/service-status')->assertOk();

        $this->assertSame('degraded', $response->json('data.overall'));
        $this->assertCount(1, $response->json('data.incidents'));
        $this->assertSame('QRIS lambat', $response->json('data.incidents.0.title'));

        $byName = collect($response->json('data.components'))->keyBy('name');
        $this->assertSame('degraded', $byName['QRIS']['status']);
        $this->assertSame('closed', $byName['BNI VA']['status']);
        $this->assertSame('operational', $byName['Digiflazz']['status']);
    }

    public function test_a_critical_incident_reports_the_component_as_down(): void
    {
        $channel = PaymentChannel::factory()->create(['name' => 'QRIS']);
        ServiceIncident::factory()->create([
            'payment_channel_id' => $channel->id,
            'severity' => 'CRITICAL',
        ]);

        Sanctum::actingAs($this->merchant());
        $response = $this->getJson('/api/v1/payment-admin/service-status')->assertOk();

        $this->assertSame('down', $response->json('data.overall'));
        $this->assertSame(
            'down',
            collect($response->json('data.components'))->firstWhere('name', 'QRIS')['status'],
        );
    }

    public function test_merchant_cannot_write_incidents(): void
    {
        $channel = PaymentChannel::factory()->create();
        Sanctum::actingAs($this->merchant());

        $this->postJson('/api/v1/payment-internal/incidents', $this->payload(['payment_channel_id' => $channel->id]))
            ->assertStatus(403);
    }
}
