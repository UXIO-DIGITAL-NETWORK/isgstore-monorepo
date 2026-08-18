<?php

namespace Tests\Feature\PaymentPage;

use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceInvoice;
use App\Models\ServiceSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The whole manual billing loop: request → invoice → bukti transfer →
 * verification → an active period.
 */
class ServiceSubscriptionFlowTest extends TestCase
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

    private function subscribe(User $merchant, Service $service): ServiceInvoice
    {
        Sanctum::actingAs($merchant);

        $response = $this->postJson('/api/v1/payment-admin/service-invoices', ['service_id' => $service->id])
            ->assertCreated();

        return ServiceInvoice::findOrFail($response->json('data.id'));
    }

    private function uploadProof(User $merchant, ServiceInvoice $invoice): void
    {
        Sanctum::actingAs($merchant);

        $this->postJson("/api/v1/payment-admin/service-invoices/{$invoice->id}/proof", [
            'proof' => UploadedFile::fake()->image('bukti.jpg'),
        ])->assertOk();
    }

    public function test_subscribing_issues_an_unpaid_invoice(): void
    {
        $service = Service::factory()->create(['selling_price' => 250000, 'duration_days' => 30]);
        $merchant = $this->merchant();
        Sanctum::actingAs($merchant);

        $this->postJson('/api/v1/payment-admin/service-invoices', ['service_id' => $service->id])
            ->assertCreated()
            ->assertJsonPath('data.status', 'UNPAID')
            ->assertJsonPath('data.amount', 250000)
            ->assertJsonPath('data.duration_days', 30)
            ->assertJsonPath('data.proof_url', null);

        // No subscription until kita confirms.
        $this->assertDatabaseCount('service_subscriptions', 0);
    }

    public function test_an_inactive_service_cannot_be_subscribed(): void
    {
        $service = Service::factory()->inactive()->create();
        Sanctum::actingAs($this->merchant());

        $this->postJson('/api/v1/payment-admin/service-invoices', ['service_id' => $service->id])
            ->assertStatus(422);
    }

    public function test_a_second_open_invoice_is_refused(): void
    {
        $service = Service::factory()->create();
        $merchant = $this->merchant();
        $this->subscribe($merchant, $service);

        Sanctum::actingAs($merchant);
        $this->postJson('/api/v1/payment-admin/service-invoices', ['service_id' => $service->id])
            ->assertStatus(422);
    }

    public function test_uploading_proof_moves_the_invoice_to_waiting_confirmation(): void
    {
        Storage::fake('public');
        $service = Service::factory()->create();
        $merchant = $this->merchant();
        $invoice = $this->subscribe($merchant, $service);

        Sanctum::actingAs($merchant);
        $response = $this->postJson("/api/v1/payment-admin/service-invoices/{$invoice->id}/proof", [
            'proof' => UploadedFile::fake()->image('bukti.jpg'),
        ])->assertOk()->assertJsonPath('data.status', 'WAITING_CONFIRMATION');

        $this->assertNotNull($response->json('data.proof_url'));
        Storage::disk('public')->assertExists($invoice->fresh()->proof_path);
    }

    public function test_confirming_opens_the_subscription_period(): void
    {
        Storage::fake('public');
        $service = Service::factory()->create(['duration_days' => 30]);
        $merchant = $this->merchant();
        $invoice = $this->subscribe($merchant, $service);
        $this->uploadProof($merchant, $invoice);

        Sanctum::actingAs($this->internal());
        $this->postJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/confirm")
            ->assertOk()
            ->assertJsonPath('data.status', 'PAID')
            ->assertJsonPath('data.subscription.status', 'ACTIVE');

        $this->assertDatabaseCount('service_subscriptions', 1);

        $subscription = $merchant->fresh()->id
            ? ServiceSubscription::where('merchant_id', $merchant->id)->firstOrFail()
            : null;

        $this->assertSame(
            30,
            (int) round(Carbon::parse($subscription->starts_at)->diffInDays($subscription->ends_at)),
        );
    }

    public function test_confirming_twice_is_refused(): void
    {
        Storage::fake('public');
        $service = Service::factory()->create();
        $merchant = $this->merchant();
        $invoice = $this->subscribe($merchant, $service);
        $this->uploadProof($merchant, $invoice);

        Sanctum::actingAs($this->internal());
        $this->postJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/confirm")->assertOk();
        $this->postJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/confirm")->assertStatus(422);

        $this->assertDatabaseCount('service_subscriptions', 1);
    }

    public function test_a_rejected_invoice_can_be_re_uploaded(): void
    {
        Storage::fake('public');
        $service = Service::factory()->create();
        $merchant = $this->merchant();
        $invoice = $this->subscribe($merchant, $service);
        $this->uploadProof($merchant, $invoice);

        Sanctum::actingAs($this->internal());
        $this->postJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/reject", ['reason' => 'Nominal tidak sesuai'])
            ->assertOk()
            ->assertJsonPath('data.status', 'REJECTED');

        Sanctum::actingAs($merchant);
        $this->postJson("/api/v1/payment-admin/service-invoices/{$invoice->id}/proof", [
            'proof' => UploadedFile::fake()->image('bukti-2.jpg'),
        ])->assertOk()->assertJsonPath('data.status', 'WAITING_CONFIRMATION');
    }

    /**
     * A client who renews early must keep the days it already paid for, so the
     * new period starts where the current one ends rather than from today.
     */
    public function test_a_renewal_stacks_on_the_current_period(): void
    {
        Storage::fake('public');
        $service = Service::factory()->create(['duration_days' => 30]);
        $merchant = $this->merchant();

        $first = $this->subscribe($merchant, $service);
        $this->uploadProof($merchant, $first);
        Sanctum::actingAs($this->internal());
        $this->postJson("/api/v1/payment-internal/service-invoices/{$first->id}/confirm")->assertOk();

        $second = $this->subscribe($merchant, $service);
        $this->uploadProof($merchant, $second);
        Sanctum::actingAs($this->internal());
        $this->postJson("/api/v1/payment-internal/service-invoices/{$second->id}/confirm")->assertOk();

        $periods = ServiceSubscription::where('merchant_id', $merchant->id)
            ->orderBy('starts_at')
            ->get();

        $this->assertCount(2, $periods);
        $this->assertSame(
            $periods[0]->ends_at->toDateTimeString(),
            $periods[1]->starts_at->toDateTimeString(),
        );
    }

    /** Another client's invoice must be indistinguishable from a missing one. */
    public function test_a_client_cannot_touch_another_clients_invoice(): void
    {
        Storage::fake('public');
        $service = Service::factory()->create();
        $owner = $this->merchant();
        $invoice = $this->subscribe($owner, $service);

        Sanctum::actingAs($this->merchant());
        $this->getJson("/api/v1/payment-admin/service-invoices/{$invoice->id}")->assertStatus(404);
        $this->postJson("/api/v1/payment-admin/service-invoices/{$invoice->id}/proof", [
            'proof' => UploadedFile::fake()->image('bukti.jpg'),
        ])->assertStatus(404);
    }

    public function test_client_only_sees_its_own_invoices_and_subscriptions(): void
    {
        $service = Service::factory()->create();
        $owner = $this->merchant();
        $this->subscribe($owner, $service);

        $other = $this->merchant();
        Sanctum::actingAs($other);

        $this->getJson('/api/v1/payment-admin/service-invoices')
            ->assertOk()
            ->assertJsonCount(0, 'data.data');
        $this->getJson('/api/v1/payment-admin/service-subscriptions')
            ->assertOk()
            ->assertJsonCount(0, 'data.data');
    }
}
