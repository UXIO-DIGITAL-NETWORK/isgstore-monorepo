<?php

namespace Tests\Feature\PaymentPage;

use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceInstallation;
use App\Models\ServiceInvoice;
use App\Models\ServiceSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Kita prepares the installation from the invoice, BEFORE confirming, so the
 * client's first view of a paid service is a scheduled one.
 */
class ServiceInvoiceInstallationTest extends TestCase
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

    /** Request + proof, deliberately NOT confirmed. */
    private function subscribeAndUpload(User $merchant, Service $service): ServiceInvoice
    {
        Storage::fake('public');
        Sanctum::actingAs($merchant);

        $id = $this->postJson('/api/v1/payment-admin/service-invoices', ['service_id' => $service->id])
            ->assertCreated()->json('data.id');

        $this->postJson("/api/v1/payment-admin/service-invoices/{$id}/proof", [
            'proof' => UploadedFile::fake()->image('bukti.jpg'),
        ])->assertOk();

        return ServiceInvoice::findOrFail($id);
    }

    private function schedule(ServiceInvoice $invoice, array $over = []): void
    {
        Sanctum::actingAs($this->internal());

        $this->putJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/installation", array_merge([
            'starts_at' => '2026-08-15',
            'ends_at' => '2026-08-20',
            'notes' => 'Perlu whitelist IP dari sisi klien.',
        ], $over))->assertOk();
    }

    public function test_internal_prepares_an_installation_before_the_invoice_is_confirmed(): void
    {
        $merchant = $this->merchant();
        $invoice = $this->subscribeAndUpload($merchant, Service::factory()->create());

        Sanctum::actingAs($this->internal());
        $this->putJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/installation", [
            'starts_at' => '2026-08-15',
            'ends_at' => '2026-08-20',
            'notes' => 'Perlu whitelist IP dari sisi klien.',
        ])
            ->assertOk()
            ->assertJsonPath('data.notes', 'Perlu whitelist IP dari sisi klien.')
            ->assertJsonPath('data.status', 'NOT_STARTED')
            ->assertJsonPath('data.progress_percent', 0);

        $this->assertDatabaseHas('service_installations', [
            'merchant_id' => $merchant->id,
            'service_id' => $invoice->service_id,
        ]);
    }

    public function test_a_prepared_installation_has_no_subscription_yet(): void
    {
        $invoice = $this->subscribeAndUpload($this->merchant(), Service::factory()->create());
        $this->schedule($invoice);

        $this->assertNull(ServiceInstallation::firstOrFail()->service_subscription_id);
        $this->assertDatabaseCount('service_subscriptions', 0);
    }

    public function test_reading_an_unprepared_invoices_installation_returns_null(): void
    {
        $invoice = $this->subscribeAndUpload($this->merchant(), Service::factory()->create());

        Sanctum::actingAs($this->internal());
        $this->getJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/installation")
            ->assertOk()
            ->assertJsonPath('data', null);
    }

    public function test_steps_and_credentials_attach_to_an_installation_prepared_from_an_invoice(): void
    {
        $invoice = $this->subscribeAndUpload($this->merchant(), Service::factory()->create());
        $this->schedule($invoice);
        $installation = ServiceInstallation::firstOrFail();

        Sanctum::actingAs($this->internal());
        $this->postJson("/api/v1/payment-internal/installations/{$installation->id}/steps", ['title' => 'Verifikasi akun'])
            ->assertCreated();
        $this->postJson("/api/v1/payment-internal/installations/{$installation->id}/detail-items", [
            'label' => 'API Key', 'value' => 'sk_live_xyz', 'is_secret' => true,
        ])->assertCreated();

        $this->getJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/installation")
            ->assertOk()
            ->assertJsonPath('data.steps_total', 1)
            ->assertJsonCount(1, 'data.details');
    }

    /** The whole point: preparation survives, and gains its period. */
    public function test_confirming_backfills_the_subscription_on_a_prepared_installation(): void
    {
        $invoice = $this->subscribeAndUpload($this->merchant(), Service::factory()->create());
        $this->schedule($invoice);

        Sanctum::actingAs($this->internal());
        $this->postJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/confirm")->assertOk();

        $this->assertDatabaseCount('service_installations', 1);
        $this->assertSame(
            ServiceSubscription::firstOrFail()->id,
            ServiceInstallation::firstOrFail()->service_subscription_id,
        );
    }

    public function test_confirming_keeps_the_steps_prepared_beforehand(): void
    {
        $invoice = $this->subscribeAndUpload($this->merchant(), Service::factory()->create());
        $this->schedule($invoice);
        $installation = ServiceInstallation::firstOrFail();

        Sanctum::actingAs($this->internal());
        $this->postJson("/api/v1/payment-internal/installations/{$installation->id}/steps", ['title' => 'Uji transaksi'])
            ->assertCreated();
        $this->postJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/confirm")->assertOk();

        $subscription = ServiceSubscription::firstOrFail();
        $this->getJson("/api/v1/payment-internal/service-subscriptions/{$subscription->id}/installation")
            ->assertOk()
            ->assertJsonPath('data.steps_total', 1)
            ->assertJsonPath('data.steps.0.title', 'Uji transaksi');
    }

    /**
     * The column records which period paid for the install. A renewal must not
     * repoint it at the second period.
     */
    public function test_a_renewal_does_not_repoint_a_prepared_installation(): void
    {
        $merchant = $this->merchant();
        $service = Service::factory()->create();

        $first = $this->subscribeAndUpload($merchant, $service);
        $this->schedule($first);
        Sanctum::actingAs($this->internal());
        $this->postJson("/api/v1/payment-internal/service-invoices/{$first->id}/confirm")->assertOk();

        $firstSubscriptionId = ServiceSubscription::firstOrFail()->id;

        $second = $this->subscribeAndUpload($merchant, $service);
        $this->schedule($second, ['starts_at' => '2026-09-15', 'ends_at' => '2026-09-20']);
        Sanctum::actingAs($this->internal());
        $this->postJson("/api/v1/payment-internal/service-invoices/{$second->id}/confirm")->assertOk();

        $this->assertDatabaseCount('service_subscriptions', 2);
        $this->assertDatabaseCount('service_installations', 1);
        $this->assertSame($firstSubscriptionId, ServiceInstallation::firstOrFail()->service_subscription_id);
    }

    /**
     * Prepared work, not an orphan: REJECTED is re-uploadable, so the same
     * invoice is usually confirmed minutes later and picks the row straight up.
     */
    public function test_rejecting_an_invoice_keeps_the_prepared_installation(): void
    {
        $invoice = $this->subscribeAndUpload($this->merchant(), Service::factory()->create());
        $this->schedule($invoice);

        Sanctum::actingAs($this->internal());
        $this->postJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/reject", ['reason' => 'Nominal tidak sesuai'])
            ->assertOk();

        $this->assertDatabaseCount('service_installations', 1);
    }

    /** No subscription exists yet, so the client has no read path to it. */
    public function test_a_client_never_sees_an_installation_prepared_for_an_unconfirmed_invoice(): void
    {
        $merchant = $this->merchant();
        $invoice = $this->subscribeAndUpload($merchant, Service::factory()->create());
        $this->schedule($invoice);

        Sanctum::actingAs($merchant);
        $this->getJson("/api/v1/payment-admin/service-invoices/{$invoice->id}")
            ->assertOk()
            ->assertJsonPath('data.subscription', null);

        $this->assertDatabaseCount('service_subscriptions', 0);
    }

    public function test_a_client_cannot_prepare_an_installation_from_an_invoice(): void
    {
        $merchant = $this->merchant();
        $invoice = $this->subscribeAndUpload($merchant, Service::factory()->create());

        Sanctum::actingAs($merchant);
        $this->putJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/installation", ['starts_at' => '2026-08-15'])
            ->assertStatus(403);
    }

    public function test_an_ends_at_before_starts_at_is_rejected_on_the_invoice_route(): void
    {
        $invoice = $this->subscribeAndUpload($this->merchant(), Service::factory()->create());

        Sanctum::actingAs($this->internal());
        $this->putJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/installation", [
            'starts_at' => '2026-08-20',
            'ends_at' => '2026-08-15',
        ])->assertStatus(422)->assertJsonValidationErrors('ends_at');
    }

    /** Two ids, one row — that is the whole grain decision, pinned. */
    public function test_the_invoice_and_subscription_routes_resolve_the_same_installation(): void
    {
        $invoice = $this->subscribeAndUpload($this->merchant(), Service::factory()->create());
        $this->schedule($invoice);

        Sanctum::actingAs($this->internal());
        $viaInvoice = $this->getJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/installation")
            ->assertOk()->json('data.id');

        $this->postJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/confirm")->assertOk();
        $subscription = ServiceSubscription::firstOrFail();

        $viaSubscription = $this->getJson("/api/v1/payment-internal/service-subscriptions/{$subscription->id}/installation")
            ->assertOk()->json('data.id');

        $this->assertSame($viaInvoice, $viaSubscription);
    }
}
