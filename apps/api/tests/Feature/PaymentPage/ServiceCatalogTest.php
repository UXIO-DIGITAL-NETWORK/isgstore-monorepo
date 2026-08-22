<?php

namespace Tests\Feature\PaymentPage;

use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ServiceCatalogTest extends TestCase
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
            'code' => 'whatsapp-api',
            'name' => 'WhatsApp API',
            'category' => 'communication',
            'description' => 'Notifikasi WhatsApp',
            'features' => ['Blast pesan'],
            'cost_price' => 200000,
            'selling_price' => 300000,
            'duration_days' => 30,
        ], $over);
    }

    public function test_internal_creates_a_service(): void
    {
        Sanctum::actingAs($this->internal());

        $this->postJson('/api/v1/payment-internal/services', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.code', 'whatsapp-api')
            ->assertJsonPath('data.cost_price', 200000)
            ->assertJsonPath('data.selling_price', 300000)
            ->assertJsonPath('data.duration_days', 30)
            ->assertJsonPath('data.category_label', 'Komunikasi');

        $this->assertDatabaseHas('services', ['code' => 'whatsapp-api', 'cost_price' => 200000, 'selling_price' => 300000]);
    }

    public function test_service_code_must_be_unique(): void
    {
        Service::factory()->create(['code' => 'whatsapp-api']);
        Sanctum::actingAs($this->internal());

        $this->postJson('/api/v1/payment-internal/services', $this->payload())
            ->assertStatus(422)
            ->assertJsonValidationErrors('code');
    }

    public function test_internal_updates_price_and_period(): void
    {
        $service = Service::factory()->create([
            'cost_price' => 80000,
            'selling_price' => 100000,
            'duration_days' => 30,
        ]);
        Sanctum::actingAs($this->internal());

        $this->putJson("/api/v1/payment-internal/services/{$service->id}", [
            'cost_price' => 90000,
            'selling_price' => 150000,
            'duration_days' => 60,
        ])
            ->assertOk()
            ->assertJsonPath('data.cost_price', 90000)
            ->assertJsonPath('data.selling_price', 150000)
            ->assertJsonPath('data.duration_days', 60);
    }

    /**
     * What a service costs kita must never reach a client. The internal list and
     * the merchant catalogue share one ServiceResource, so this is the only
     * thing standing between the two audiences.
     */
    public function test_cost_price_is_internal_only(): void
    {
        Service::factory()->create(['code' => 'uxiotopup', 'cost_price' => 180000, 'selling_price' => 250000]);

        Sanctum::actingAs($this->internal());
        $this->getJson('/api/v1/payment-internal/services')
            ->assertOk()
            ->assertJsonPath('data.data.0.cost_price', 180000)
            ->assertJsonPath('data.data.0.selling_price', 250000);

        Sanctum::actingAs($this->merchant());
        $row = $this->getJson('/api/v1/payment-admin/services')
            ->assertOk()
            ->json('data.data.0');

        $this->assertSame(250000, $row['selling_price']);
        $this->assertArrayNotHasKey('cost_price', $row);
    }

    /**
     * The FKs cascade, so deleting a sold service would silently take its
     * billing history with it. Deactivating is the intended escape hatch.
     */
    public function test_a_service_with_subscriptions_cannot_be_deleted(): void
    {
        $service = Service::factory()->create();
        ServiceSubscription::factory()->create([
            'service_id' => $service->id,
            'merchant_id' => $this->merchant()->id,
        ]);
        Sanctum::actingAs($this->internal());

        $this->deleteJson("/api/v1/payment-internal/services/{$service->id}")->assertStatus(422);

        $this->assertDatabaseHas('services', ['id' => $service->id]);
    }

    public function test_an_unsold_service_can_be_deleted(): void
    {
        $service = Service::factory()->create();
        Sanctum::actingAs($this->internal());

        $this->deleteJson("/api/v1/payment-internal/services/{$service->id}")->assertOk();

        $this->assertDatabaseMissing('services', ['id' => $service->id]);
    }

    public function test_client_catalog_hides_inactive_services(): void
    {
        Service::factory()->create(['name' => 'Uxiotopup']);
        Service::factory()->inactive()->create(['name' => 'Layanan Lama']);
        Sanctum::actingAs($this->merchant());

        $response = $this->getJson('/api/v1/payment-admin/services')->assertOk();

        $names = array_column($response->json('data.data'), 'name');
        $this->assertContains('Uxiotopup', $names);
        $this->assertNotContains('Layanan Lama', $names);
    }

    public function test_role_gates(): void
    {
        Sanctum::actingAs($this->merchant());
        $this->postJson('/api/v1/payment-internal/services', $this->payload())->assertStatus(403);

        Sanctum::actingAs($this->internal());
        $this->getJson('/api/v1/payment-admin/services')->assertStatus(403);
    }
}
