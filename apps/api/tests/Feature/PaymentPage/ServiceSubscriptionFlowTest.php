<?php

namespace Tests\Feature\PaymentPage;

use App\Models\Service;
use App\Models\ServiceSubscription;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\PaymentPage\Concerns\PaysServiceInvoices;
use Tests\TestCase;

/**
 * The whole billing loop: request → invoice with an open Monetapay payment →
 * confirmation → an active period.
 *
 * The webhook half — how a payment actually becomes confirmed in production —
 * is covered by ServiceInvoiceWebhookTest. What is exercised here is the manual
 * confirmation that stays as the fallback, and the invariants around it.
 */
class ServiceSubscriptionFlowTest extends TestCase
{
    use PaysServiceInvoices;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->fakeGateway();
    }

    public function test_subscribing_issues_an_unpaid_invoice_with_a_payment(): void
    {
        $service = Service::factory()->create(['selling_price' => 250000, 'duration_days' => 30]);
        $merchant = $this->merchant();
        $channel = $this->qrisChannel();
        Sanctum::actingAs($merchant, ['access-api']);

        $this->postJson('/api/v1/payment-admin/service-invoices', [
            'service_id' => $service->id,
            'payment_channel_id' => $channel->id,
        ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'UNPAID')
            ->assertJsonPath('data.amount', 250000)
            ->assertJsonPath('data.duration_days', 30)
            ->assertJsonPath('data.payment.status', 'PENDING')
            ->assertJsonPath('data.payment.total', 250000)
            ->assertJsonPath('data.payment.instructions.qr_string', '000201-QR');

        // No subscription until the payment is confirmed.
        $this->assertDatabaseCount('service_subscriptions', 0);
    }

    public function test_a_payment_channel_is_required(): void
    {
        $service = Service::factory()->create();
        Sanctum::actingAs($this->merchant(), ['access-api']);

        $this->postJson('/api/v1/payment-admin/service-invoices', ['service_id' => $service->id])
            ->assertStatus(422)
            ->assertJsonValidationErrors('payment_channel_id');
    }

    public function test_an_inactive_service_cannot_be_subscribed(): void
    {
        $service = Service::factory()->inactive()->create();
        Sanctum::actingAs($this->merchant(), ['access-api']);

        $this->postJson('/api/v1/payment-admin/service-invoices', [
            'service_id' => $service->id,
            'payment_channel_id' => $this->qrisChannel()->id,
        ])->assertStatus(422);
    }

    public function test_a_second_open_invoice_is_refused(): void
    {
        $service = Service::factory()->create();
        $merchant = $this->merchant();
        $channel = $this->qrisChannel();
        $this->subscribe($merchant, $service, $channel);

        Sanctum::actingAs($merchant, ['access-api']);
        $this->postJson('/api/v1/payment-admin/service-invoices', [
            'service_id' => $service->id,
            'payment_channel_id' => $channel->id,
        ])->assertStatus(422);
    }

    /**
     * A bill nobody can pay would trip the one-open-invoice guard and lock the
     * client out of subscribing at all, so a failed gateway call must leave no
     * trace behind.
     */
    public function test_a_failed_gateway_call_leaves_no_invoice_behind(): void
    {
        // A second Http::fake() only appends a stub and the first match wins,
        // so the happy-path fake from setUp has to be swapped out entirely.
        Http::swap(new HttpFactory);
        Http::preventStrayRequests();
        Http::fake(['*' => Http::response(['code' => 500, 'message' => 'gateway down'], 500)]);

        $service = Service::factory()->create();
        Sanctum::actingAs($this->merchant(), ['access-api']);

        $this->postJson('/api/v1/payment-admin/service-invoices', [
            'service_id' => $service->id,
            'payment_channel_id' => $this->qrisChannel()->id,
        ])->assertStatus(422);

        $this->assertDatabaseCount('service_invoices', 0);
    }

    public function test_confirming_opens_the_subscription_period(): void
    {
        $service = Service::factory()->create(['duration_days' => 30]);
        $merchant = $this->merchant();
        $invoice = $this->subscribe($merchant, $service);

        Sanctum::actingAs($this->internal(), ['access-api']);
        $this->postJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/confirm")
            ->assertOk()
            ->assertJsonPath('data.status', 'PAID')
            ->assertJsonPath('data.subscription.status', 'ACTIVE');

        $this->assertDatabaseCount('service_subscriptions', 1);

        $subscription = ServiceSubscription::where('merchant_id', $merchant->id)->firstOrFail();

        $this->assertSame(
            30,
            (int) round(Carbon::parse($subscription->starts_at)->diffInDays($subscription->ends_at)),
        );
    }

    public function test_confirming_twice_is_refused(): void
    {
        $service = Service::factory()->create();
        $merchant = $this->merchant();
        $invoice = $this->subscribe($merchant, $service);

        Sanctum::actingAs($this->internal(), ['access-api']);
        $this->postJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/confirm")->assertOk();
        $this->postJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/confirm")->assertStatus(422);

        $this->assertDatabaseCount('service_subscriptions', 1);
    }

    public function test_a_rejected_invoice_can_be_paid_again(): void
    {
        $service = Service::factory()->create();
        $merchant = $this->merchant();
        $channel = $this->qrisChannel();
        $invoice = $this->subscribe($merchant, $service, $channel);

        Sanctum::actingAs($this->internal(), ['access-api']);
        $this->postJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/reject", ['reason' => 'Nominal tidak sesuai'])
            ->assertOk()
            ->assertJsonPath('data.status', 'REJECTED');

        // A rejected bill is not UNPAID, so it is not payable — the client
        // subscribes again rather than retrying a bill kita has refused.
        Sanctum::actingAs($merchant, ['access-api']);
        $this->postJson("/api/v1/payment-admin/service-invoices/{$invoice->id}/pay", [
            'payment_channel_id' => $channel->id,
        ])->assertStatus(422);

        $this->postJson('/api/v1/payment-admin/service-invoices', [
            'service_id' => $service->id,
            'payment_channel_id' => $channel->id,
        ])->assertCreated();
    }

    /**
     * A client who renews early must keep the days it already paid for, so the
     * new period starts where the current one ends rather than from today.
     */
    public function test_a_renewal_stacks_on_the_current_period(): void
    {
        $service = Service::factory()->create(['duration_days' => 30]);
        $merchant = $this->merchant();
        $channel = $this->qrisChannel();

        $first = $this->subscribe($merchant, $service, $channel);
        Sanctum::actingAs($this->internal(), ['access-api']);
        $this->postJson("/api/v1/payment-internal/service-invoices/{$first->id}/confirm")->assertOk();

        $second = $this->subscribe($merchant, $service, $channel);
        Sanctum::actingAs($this->internal(), ['access-api']);
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
        $service = Service::factory()->create();
        $owner = $this->merchant();
        $channel = $this->qrisChannel();
        $invoice = $this->subscribe($owner, $service, $channel);

        Sanctum::actingAs($this->merchant(), ['access-api']);
        $this->getJson("/api/v1/payment-admin/service-invoices/{$invoice->id}")->assertStatus(404);
        $this->postJson("/api/v1/payment-admin/service-invoices/{$invoice->id}/pay", [
            'payment_channel_id' => $channel->id,
        ])->assertStatus(404);
    }

    public function test_client_only_sees_its_own_invoices_and_subscriptions(): void
    {
        $service = Service::factory()->create();
        $owner = $this->merchant();
        $this->subscribe($owner, $service);

        $other = $this->merchant();
        Sanctum::actingAs($other, ['access-api']);

        $this->getJson('/api/v1/payment-admin/service-invoices')
            ->assertOk()
            ->assertJsonCount(0, 'data.data');
        $this->getJson('/api/v1/payment-admin/service-subscriptions')
            ->assertOk()
            ->assertJsonCount(0, 'data.data');
    }
}
