<?php

namespace Tests\Feature\PaymentPage;

use App\Models\Service;
use App\Models\ServiceInstallation;
use App\Models\ServiceInstallationStep;
use App\Models\ServiceInvoice;
use App\Models\ServiceSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\PaymentPage\Concerns\PaysServiceInvoices;
use Tests\TestCase;

class ServiceInstallationTest extends TestCase
{
    use PaysServiceInvoices;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->fakeGateway();
    }

    /** Drives one invoice through the real flow: request → payment → paid. */
    private function buyAndConfirm(User $merchant, Service $service): ServiceInvoice
    {
        $invoice = $this->subscribe($merchant, $service);

        Sanctum::actingAs($this->internal());
        $this->postJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/confirm")->assertOk();

        return $invoice->fresh();
    }

    public function test_confirming_an_invoice_opens_exactly_one_installation(): void
    {
        $merchant = $this->merchant();
        $service = Service::factory()->create();

        $this->buyAndConfirm($merchant, $service);

        $this->assertDatabaseCount('service_installations', 1);
        $this->assertDatabaseHas('service_installations', [
            'merchant_id' => $merchant->id,
            'service_id' => $service->id,
        ]);
    }

    /**
     * The regression net for the grain decision: installations are per service
     * account, not per paid period. If this breaks, a client loses their
     * checklist and their API keys the moment they renew.
     */
    public function test_a_renewal_reuses_the_same_installation(): void
    {
        $merchant = $this->merchant();
        $service = Service::factory()->create();

        $this->buyAndConfirm($merchant, $service);
        $installation = ServiceInstallation::firstOrFail();
        ServiceInstallationStep::factory()->create(['service_installation_id' => $installation->id]);

        $this->buyAndConfirm($merchant, $service);

        $this->assertDatabaseCount('service_subscriptions', 2);
        $this->assertDatabaseCount('service_installations', 1);
        $this->assertSame($installation->id, ServiceInstallation::firstOrFail()->id);
        $this->assertSame(1, $installation->steps()->count());
    }

    public function test_internal_sets_the_installation_window(): void
    {
        $merchant = $this->merchant();
        $service = Service::factory()->create();
        $this->buyAndConfirm($merchant, $service);
        $subscription = ServiceSubscription::firstOrFail();

        Sanctum::actingAs($this->internal());
        $this->putJson("/api/v1/payment-internal/service-subscriptions/{$subscription->id}/installation", [
            'starts_at' => '2026-08-15',
            'ends_at' => '2026-08-20',
            'notes' => 'Perlu whitelist IP dari sisi klien.',
        ])
            ->assertOk()
            ->assertJsonPath('data.notes', 'Perlu whitelist IP dari sisi klien.')
            ->assertJsonPath('data.status', 'NOT_STARTED')
            ->assertJsonPath('data.progress_percent', 0);
    }

    public function test_an_ends_at_before_starts_at_is_rejected(): void
    {
        $merchant = $this->merchant();
        $this->buyAndConfirm($merchant, Service::factory()->create());
        $subscription = ServiceSubscription::firstOrFail();

        Sanctum::actingAs($this->internal());
        $this->putJson("/api/v1/payment-internal/service-subscriptions/{$subscription->id}/installation", [
            'starts_at' => '2026-08-20',
            'ends_at' => '2026-08-15',
        ])->assertStatus(422)->assertJsonValidationErrors('ends_at');
    }

    public function test_progress_is_derived_from_completed_steps(): void
    {
        $merchant = $this->merchant();
        $this->buyAndConfirm($merchant, Service::factory()->create());
        $subscription = ServiceSubscription::firstOrFail();
        $installation = ServiceInstallation::firstOrFail();

        ServiceInstallationStep::factory()->count(2)->completed()->create(['service_installation_id' => $installation->id]);
        ServiceInstallationStep::factory()->count(2)->create(['service_installation_id' => $installation->id]);

        Sanctum::actingAs($this->internal());
        $this->getJson("/api/v1/payment-internal/service-subscriptions/{$subscription->id}/installation")
            ->assertOk()
            ->assertJsonPath('data.steps_total', 4)
            ->assertJsonPath('data.steps_completed', 2)
            ->assertJsonPath('data.progress_percent', 50)
            ->assertJsonPath('data.status', 'IN_PROGRESS');
    }

    public function test_a_fully_ticked_checklist_reads_done(): void
    {
        $merchant = $this->merchant();
        $this->buyAndConfirm($merchant, Service::factory()->create());
        $subscription = ServiceSubscription::firstOrFail();
        ServiceInstallationStep::factory()->count(2)->completed()
            ->create(['service_installation_id' => ServiceInstallation::firstOrFail()->id]);

        Sanctum::actingAs($this->internal());
        $this->getJson("/api/v1/payment-internal/service-subscriptions/{$subscription->id}/installation")
            ->assertJsonPath('data.progress_percent', 100)
            ->assertJsonPath('data.status', 'DONE');
    }

    public function test_setting_completion_is_idempotent(): void
    {
        $merchant = $this->merchant();
        $this->buyAndConfirm($merchant, Service::factory()->create());
        $step = ServiceInstallationStep::factory()->create([
            'service_installation_id' => ServiceInstallation::firstOrFail()->id,
        ]);

        Sanctum::actingAs($this->internal());
        $first = $this->postJson("/api/v1/payment-internal/installation-steps/{$step->id}/completion", ['completed' => true])
            ->assertOk()->json('data.completed_at');

        // A double-tap or a second open tab must converge, not flip-flop.
        $second = $this->postJson("/api/v1/payment-internal/installation-steps/{$step->id}/completion", ['completed' => true])
            ->assertOk()->json('data.completed_at');

        $this->assertSame($first, $second);

        $this->postJson("/api/v1/payment-internal/installation-steps/{$step->id}/completion", ['completed' => false])
            ->assertOk()
            ->assertJsonPath('data.is_completed', false)
            ->assertJsonPath('data.completed_at', null);
    }

    public function test_a_new_step_lands_at_the_end_of_the_order(): void
    {
        $merchant = $this->merchant();
        $this->buyAndConfirm($merchant, Service::factory()->create());
        $installation = ServiceInstallation::firstOrFail();
        ServiceInstallationStep::factory()->create(['service_installation_id' => $installation->id, 'sort_order' => 7]);

        Sanctum::actingAs($this->internal());
        $this->postJson("/api/v1/payment-internal/installations/{$installation->id}/steps", ['title' => 'Uji transaksi'])
            ->assertCreated()
            ->assertJsonPath('data.sort_order', 8);
    }

    public function test_deleting_a_step_recomputes_progress(): void
    {
        $merchant = $this->merchant();
        $this->buyAndConfirm($merchant, Service::factory()->create());
        $subscription = ServiceSubscription::firstOrFail();
        $installation = ServiceInstallation::firstOrFail();

        ServiceInstallationStep::factory()->completed()->create(['service_installation_id' => $installation->id]);
        $pending = ServiceInstallationStep::factory()->create(['service_installation_id' => $installation->id]);

        Sanctum::actingAs($this->internal());
        $this->deleteJson("/api/v1/payment-internal/installation-steps/{$pending->id}")->assertOk();

        $this->getJson("/api/v1/payment-internal/service-subscriptions/{$subscription->id}/installation")
            ->assertJsonPath('data.steps_total', 1)
            ->assertJsonPath('data.progress_percent', 100);
    }

    public function test_a_client_reads_its_own_installation(): void
    {
        $merchant = $this->merchant();
        $this->buyAndConfirm($merchant, Service::factory()->create());
        $subscription = ServiceSubscription::firstOrFail();

        Sanctum::actingAs($merchant);
        $this->getJson("/api/v1/payment-admin/service-subscriptions/{$subscription->id}/installation")
            ->assertOk()
            ->assertJsonPath('data.status', 'NOT_STARTED');
    }

    public function test_a_client_cannot_read_another_clients_installation(): void
    {
        $owner = $this->merchant();
        $this->buyAndConfirm($owner, Service::factory()->create());
        $subscription = ServiceSubscription::firstOrFail();

        Sanctum::actingAs($this->merchant());
        $this->getJson("/api/v1/payment-admin/service-subscriptions/{$subscription->id}/installation")
            ->assertStatus(404);
    }

    public function test_a_client_cannot_write_a_step(): void
    {
        $merchant = $this->merchant();
        $this->buyAndConfirm($merchant, Service::factory()->create());
        $installation = ServiceInstallation::firstOrFail();

        Sanctum::actingAs($merchant);
        $this->postJson("/api/v1/payment-internal/installations/{$installation->id}/steps", ['title' => 'x'])
            ->assertStatus(403);
    }

    /** A comped subscription has no installation until kita schedules one. */
    public function test_a_subscription_with_no_installation_returns_null(): void
    {
        $merchant = $this->merchant();
        $subscription = ServiceSubscription::factory()->create(['merchant_id' => $merchant->id]);

        Sanctum::actingAs($merchant);
        $this->getJson("/api/v1/payment-admin/service-subscriptions/{$subscription->id}/installation")
            ->assertOk()
            ->assertJsonPath('data', null);
    }
}
