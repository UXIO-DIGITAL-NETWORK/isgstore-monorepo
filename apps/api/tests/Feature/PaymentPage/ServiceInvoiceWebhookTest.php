<?php

declare(strict_types=1);

namespace Tests\Feature\PaymentPage;

use App\Enums\ServiceInvoiceStatus;
use App\Models\PlatformMutation;
use App\Models\Service;
use App\Models\ServiceInstallation;
use App\Models\ServiceInvoicePayment;
use App\Models\ServiceSubscription;
use App\Services\Payment\MonetapayService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\PaymentPage\Concerns\PaysServiceInvoices;
use Tests\TestCase;

/**
 * The Monetapay callback, from the service-bill side.
 *
 * This is the path a client's money actually travels in production: nothing
 * else marks a service bill paid on its own. The guarantees pinned here are
 * the ones that cost real money when they break — a replayed webhook opening a
 * second period, a tampered amount buying a subscription cheap, or a bill of
 * one payable type being settled by another's reference.
 */
class ServiceInvoiceWebhookTest extends TestCase
{
    use PaysServiceInvoices;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->fakeGateway();
        // The signature is computed against the configured token, so it has to
        // be a known value rather than whatever the environment happens to set.
        config(['services.monetapay.token' => 'test-token']);
    }

    /**
     * Builds the envelope Monetapay posts: a `__`-delimited key=value string,
     * signed with the double-MD5 the service verifies, then AES-encrypted.
     */
    private function signedPayload(string $reference, int $amount, string $status = '3', ?string $sign = null): array
    {
        $params = [
            'mch_order_no' => $reference,
            'amount' => (string) $amount,
            'status' => $status,
        ];

        $timestamp = (string) time();

        ksort($params);
        $buffer = '';
        foreach ($params as $key => $value) {
            $buffer .= $key.'='.$value.'__';
        }
        $strMap = substr($buffer, 0, -2);

        $params['sign'] = $sign ?? md5(md5('test-token'.'*|*'.$strMap.'@!@'.$timestamp));
        $params['timestamp'] = $timestamp;

        $flat = collect($params)->map(fn ($v, $k) => "{$k}={$v}")->implode('__');

        return ['data' => ['en_data' => app(MonetapayService::class)->encryptPayload($flat)]];
    }

    private function sendCallback(array $payload)
    {
        return $this->postJson('/api/v1/payment/callback', $payload);
    }

    public function test_a_paid_callback_opens_the_subscription(): void
    {
        $merchant = $this->merchant();
        $service = Service::factory()->create(['selling_price' => 250000, 'duration_days' => 30]);
        $invoice = $this->subscribe($merchant, $service, $this->qrisChannel());
        $attempt = ServiceInvoicePayment::firstOrFail();

        $this->sendCallback($this->signedPayload($attempt->reference_id, $attempt->total))->assertOk();

        $this->assertSame(ServiceInvoiceStatus::PAID, $invoice->fresh()->status);
        $this->assertSame('PAID', $attempt->fresh()->status);
        $this->assertNotNull($attempt->fresh()->paid_at);

        $subscription = ServiceSubscription::where('merchant_id', $merchant->id)->firstOrFail();
        $this->assertSame('ACTIVE', $subscription->status->value);
        $this->assertSame(
            30,
            (int) round(Carbon::parse($subscription->starts_at)->diffInDays($subscription->ends_at)),
        );

        // The installation record every paid service gets, so the client's
        // invoice page never has to render a null.
        $this->assertDatabaseHas('service_installations', [
            'merchant_id' => $merchant->id,
            'service_id' => $service->id,
        ]);
    }

    /**
     * Platform income (PlatformBalance) must move when a service bill settles —
     * by the BILL, not by what the client handed over.
     *
     * The difference is the channel fee, and it is not kita's income: it buys
     * the gateway's cut, which Monetapay keeps. `PlatformBalance::income()` is
     * withdrawable money, so booking the fee there would authorise withdrawing
     * cash that never arrived. The manual confirm path has always credited
     * `invoice->amount`; this is the webhook catching up to it.
     */
    public function test_a_paid_callback_books_the_bill_as_revenue_once_excluding_the_fee(): void
    {
        $channel = $this->qrisChannel(['fee_flat' => 2500, 'fee_percent' => 1]);
        $invoice = $this->subscribe($this->merchant(), Service::factory()->create(['selling_price' => 250000]), $channel);
        $attempt = ServiceInvoicePayment::firstOrFail();

        // 250.000 + (2.500 + 1%) = 255.000 charged, 250.000 booked.
        $this->assertSame(5000, (int) $attempt->admin_fee);
        $this->assertSame(255000, (int) $attempt->total);

        $payload = $this->signedPayload($attempt->reference_id, $attempt->total);
        $this->sendCallback($payload)->assertOk();
        // A retried webhook must not double-book the same revenue.
        $this->sendCallback($payload)->assertOk();

        $this->assertSame(
            1,
            PlatformMutation::where('type', 'service_revenue')->where('reference', $attempt->reference_id)->count(),
        );
        $this->assertDatabaseHas('platform_mutations', [
            'type' => 'service_revenue',
            'reference' => $attempt->reference_id,
            'amount' => 250000,
        ]);
    }

    public function test_a_paid_callback_notifies_discord(): void
    {
        config(['services.discord.webhook_log_url' => 'https://discord.test/hook']);

        $service = Service::factory()->create(['selling_price' => 250000]);
        $invoice = $this->subscribe($this->merchant(), $service, $this->qrisChannel());
        $attempt = ServiceInvoicePayment::firstOrFail();

        $this->sendCallback($this->signedPayload($attempt->reference_id, $attempt->total))->assertOk();

        Http::assertSent(function ($request) use ($invoice) {
            if ($request->url() !== 'https://discord.test/hook') {
                return false;
            }

            $embed = $request['embeds'][0] ?? null;
            $fields = collect($embed['fields'] ?? []);

            return $embed['title'] === '[MONETAPAY] 🧾 Pembayaran Layanan Berhasil'
                && $fields->firstWhere('name', '🧾 Invoice')['value'] === '`'.$invoice->invoice_number.'`'
                && str_contains($fields->firstWhere('name', '📊 Status')['value'], 'PAID');
        });
    }

    /** Monetapay retries; a replay must not buy a second period. */
    public function test_a_replayed_callback_is_ignored(): void
    {
        $invoice = $this->subscribe($this->merchant(), Service::factory()->create(), $this->qrisChannel());
        $attempt = ServiceInvoicePayment::firstOrFail();

        $payload = $this->signedPayload($attempt->reference_id, $attempt->total);

        $this->sendCallback($payload)->assertOk();
        $this->sendCallback($payload)->assertOk();

        $this->assertDatabaseCount('service_subscriptions', 1);
        $this->assertSame(ServiceInvoiceStatus::PAID, $invoice->fresh()->status);
    }

    /** A tampered amount must not buy a subscription cheap. */
    public function test_an_amount_mismatch_is_refused(): void
    {
        $invoice = $this->subscribe($this->merchant(), Service::factory()->create(), $this->qrisChannel());
        $attempt = ServiceInvoicePayment::firstOrFail();

        $this->sendCallback($this->signedPayload($attempt->reference_id, $attempt->total - 1))
            ->assertStatus(500);

        $this->assertSame(ServiceInvoiceStatus::UNPAID, $invoice->fresh()->status);
        $this->assertSame('PENDING', $attempt->fresh()->status);
        $this->assertDatabaseCount('service_subscriptions', 0);
    }

    public function test_a_bad_signature_is_refused(): void
    {
        $invoice = $this->subscribe($this->merchant(), Service::factory()->create(), $this->qrisChannel());
        $attempt = ServiceInvoicePayment::firstOrFail();

        $this->sendCallback($this->signedPayload($attempt->reference_id, $attempt->total, sign: str_repeat('0', 32)))
            ->assertStatus(400);

        $this->assertSame(ServiceInvoiceStatus::UNPAID, $invoice->fresh()->status);
        $this->assertDatabaseCount('service_subscriptions', 0);
    }

    /** Any status outside the success allowlist closes the attempt. */
    public function test_a_failed_status_expires_the_attempt(): void
    {
        $invoice = $this->subscribe($this->merchant(), Service::factory()->create(), $this->qrisChannel());
        $attempt = ServiceInvoicePayment::firstOrFail();

        $this->sendCallback($this->signedPayload($attempt->reference_id, $attempt->total, status: '9'))->assertOk();

        $this->assertSame('EXPIRED', $attempt->fresh()->status);
        $this->assertSame(ServiceInvoiceStatus::UNPAID, $invoice->fresh()->status);
        $this->assertDatabaseCount('service_subscriptions', 0);
    }

    public function test_a_renewal_paid_by_webhook_stacks_on_the_current_period(): void
    {
        $merchant = $this->merchant();
        $service = Service::factory()->create(['duration_days' => 30]);
        $channel = $this->qrisChannel();

        $first = $this->subscribe($merchant, $service, $channel);
        $firstAttempt = ServiceInvoicePayment::where('service_invoice_id', $first->id)->firstOrFail();
        $this->sendCallback($this->signedPayload($firstAttempt->reference_id, $firstAttempt->total))->assertOk();

        $second = $this->subscribe($merchant, $service, $channel);
        $secondAttempt = ServiceInvoicePayment::where('service_invoice_id', $second->id)->firstOrFail();
        $this->sendCallback($this->signedPayload($secondAttempt->reference_id, $secondAttempt->total))->assertOk();

        $periods = ServiceSubscription::where('merchant_id', $merchant->id)->orderBy('starts_at')->get();

        $this->assertCount(2, $periods);
        $this->assertSame(
            $periods[0]->ends_at->toDateTimeString(),
            $periods[1]->starts_at->toDateTimeString(),
        );
        $this->assertSame(1, ServiceInstallation::where('merchant_id', $merchant->id)->count());
    }

    /**
     * A payment-internal user may have marked the bill paid while the callback
     * was in flight. The attempt still records the money; a second period is
     * what must not happen.
     */
    public function test_a_callback_for_an_already_confirmed_invoice_opens_no_second_period(): void
    {
        $merchant = $this->merchant();
        $invoice = $this->subscribe($merchant, Service::factory()->create(), $this->qrisChannel());
        $attempt = ServiceInvoicePayment::firstOrFail();

        Sanctum::actingAs($this->internal(), ['access-api']);
        $this->postJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/confirm")->assertOk();

        $this->sendCallback($this->signedPayload($attempt->reference_id, $attempt->total))->assertOk();

        $this->assertDatabaseCount('service_subscriptions', 1);
        $this->assertSame('PAID', $attempt->fresh()->status);
    }

    /**
     * The most important regression of this change: the callback tells payable
     * types apart by reference prefix, so an unknown one must not be swallowed
     * into the service branch — or, worse, the checkout branch.
     */
    public function test_an_unknown_reference_is_not_treated_as_a_service_bill(): void
    {
        $this->subscribe($this->merchant(), Service::factory()->create(), $this->qrisChannel());

        // PAY- belongs to checkout, which has no matching payments row here.
        $this->sendCallback($this->signedPayload('PAY-INV-20260818-ABCDEF-01', 250000))->assertStatus(500);

        // SRV- with no attempt behind it must also fail loudly rather than
        // silently marking some other bill paid.
        $this->sendCallback($this->signedPayload('SRV-20260818-NOTREAL1', 250000))->assertStatus(500);

        $this->assertDatabaseCount('service_subscriptions', 0);
    }
}
