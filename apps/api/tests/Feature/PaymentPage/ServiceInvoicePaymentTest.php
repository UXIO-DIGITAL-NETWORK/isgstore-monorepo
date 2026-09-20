<?php

declare(strict_types=1);

namespace Tests\Feature\PaymentPage;

use App\Enums\ServiceInvoiceStatus;
use App\Models\PlatformMutation;
use App\Models\Service;
use App\Models\ServiceInvoicePayment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\PaymentPage\Concerns\PaysServiceInvoices;
use Tests\TestCase;

/**
 * Opening a Monetapay payment against a service bill.
 *
 * The money-facing rules live here: what the client is charged, what the
 * gateway is asked to collect, and which methods are allowed at all.
 */
class ServiceInvoicePaymentTest extends TestCase
{
    use PaysServiceInvoices;
    use RefreshDatabase;

    public function test_qris_returns_a_qr_string(): void
    {
        $this->fakeGateway(['order_no' => 'MP-9', 'qr_string' => '000201-QRIS']);
        $merchant = $this->merchant();
        $service = Service::factory()->create(['selling_price' => 250000]);

        $invoice = $this->subscribe($merchant, $service, $this->qrisChannel());

        Sanctum::actingAs($merchant, ['access-api']);
        $this->getJson("/api/v1/payment-admin/service-invoices/{$invoice->id}")
            ->assertOk()
            ->assertJsonPath('data.payment.type', 'qris')
            ->assertJsonPath('data.payment.instructions.qr_string', '000201-QRIS')
            ->assertJsonPath('data.payment.instructions.order_no', 'MP-9');
    }

    public function test_a_virtual_account_returns_an_account_number(): void
    {
        $this->fakeGateway(['order_no' => 'MP-10', 'virtual_account' => '8808123456', 'account_bank_code' => 'BCA']);
        $merchant = $this->merchant();
        $service = Service::factory()->create();

        $invoice = $this->subscribe($merchant, $service, $this->vaChannel());

        Sanctum::actingAs($merchant, ['access-api']);
        $this->getJson("/api/v1/payment-admin/service-invoices/{$invoice->id}")
            ->assertOk()
            ->assertJsonPath('data.payment.type', 'virtual_account')
            ->assertJsonPath('data.payment.instructions.virtual_account', '8808123456')
            ->assertJsonPath('data.payment.instructions.bank_code', 'BCA');
    }

    /**
     * An e-wallet charge answers with nothing but a link. The storefront's
     * equivalent filter drops both keys, which leaves an e-wallet payment there
     * with nothing to open — this path must keep them.
     */
    public function test_an_ewallet_keeps_its_redirect_and_deeplink(): void
    {
        $this->fakeGateway([
            'order_no' => 'MP-11',
            'redirect_url' => 'https://pay.example/redirect',
            'deeplink_url' => 'gojek://pay',
        ]);
        $merchant = $this->merchant();

        $invoice = $this->subscribe(
            $merchant,
            Service::factory()->create(),
            $this->qrisChannel(['payment_type' => 'ewallet', 'channel_code' => 'gopay', 'name' => 'GoPay']),
        );

        Sanctum::actingAs($merchant, ['access-api']);
        $this->getJson("/api/v1/payment-admin/service-invoices/{$invoice->id}")
            ->assertOk()
            ->assertJsonPath('data.payment.instructions.redirect_url', 'https://pay.example/redirect')
            ->assertJsonPath('data.payment.instructions.deeplink_url', 'gojek://pay');
    }

    /**
     * The same arithmetic a storefront top-up uses: flat fee plus a percentage
     * of the bill, charged on top and shown separately.
     */
    public function test_the_channel_fee_is_added_on_top_and_sent_to_the_gateway(): void
    {
        $this->fakeGateway();
        $merchant = $this->merchant();
        $service = Service::factory()->create(['selling_price' => 250000]);
        $channel = $this->qrisChannel(['fee_flat' => 1500, 'fee_percent' => 2]);

        $invoice = $this->subscribe($merchant, $service, $channel);

        // 1500 + 2% of 250 000 = 6 500.
        $attempt = ServiceInvoicePayment::where('service_invoice_id', $invoice->id)->firstOrFail();
        $this->assertSame(250000, $attempt->amount);
        $this->assertSame(6500, $attempt->admin_fee);
        $this->assertSame(256500, $attempt->total);

        // The bill stays what was agreed; only the payment carries the fee.
        $this->assertSame(250000, (int) $invoice->amount);

        Sanctum::actingAs($merchant, ['access-api']);
        $this->getJson("/api/v1/payment-admin/service-invoices/{$invoice->id}")
            ->assertOk()
            ->assertJsonPath('data.amount', 250000)
            ->assertJsonPath('data.payment.admin_fee', 6500)
            ->assertJsonPath('data.payment.total', 256500);
    }

    public function test_a_channel_below_its_minimum_is_refused(): void
    {
        $this->fakeGateway();
        Sanctum::actingAs($merchant = $this->merchant(), ['access-api']);

        $this->postJson('/api/v1/payment-admin/service-invoices', [
            'service_id' => Service::factory()->create(['selling_price' => 5000])->id,
            'payment_channel_id' => $this->vaChannel(['min_amount' => 10000])->id,
        ])->assertStatus(422);
    }

    /**
     * The merchant's settlement balance is money kita owes the merchant, not a
     * way for it to pay kita back.
     */
    public function test_the_wallet_channel_cannot_pay_a_service_bill(): void
    {
        $this->fakeGateway();
        Sanctum::actingAs($this->merchant(), ['access-api']);

        $this->postJson('/api/v1/payment-admin/service-invoices', [
            'service_id' => Service::factory()->create()->id,
            'payment_channel_id' => $this->qrisChannel([
                'payment_type' => 'balance',
                'channel_code' => 'balance',
                'name' => 'Saldo',
            ])->id,
        ])->assertStatus(422);
    }

    public function test_an_inactive_channel_is_refused(): void
    {
        $this->fakeGateway();
        Sanctum::actingAs($this->merchant(), ['access-api']);

        $this->postJson('/api/v1/payment-admin/service-invoices', [
            'service_id' => Service::factory()->create()->id,
            'payment_channel_id' => $this->qrisChannel(['is_active' => false])->id,
        ])->assertStatus(422);
    }

    /**
     * A VA expires in minutes while the bill is due in days, so re-opening is
     * the normal case — and the abandoned attempt must stop being payable.
     */
    public function test_re_opening_expires_the_previous_attempt(): void
    {
        $this->fakeGateway();
        $merchant = $this->merchant();
        $invoice = $this->subscribe($merchant, Service::factory()->create(), $this->qrisChannel());

        Sanctum::actingAs($merchant, ['access-api']);
        $this->postJson("/api/v1/payment-admin/service-invoices/{$invoice->id}/pay", [
            'payment_channel_id' => $this->vaChannel()->id,
        ])->assertOk()->assertJsonPath('data.payment.type', 'virtual_account');

        $attempts = ServiceInvoicePayment::where('service_invoice_id', $invoice->id)->get();

        $this->assertCount(2, $attempts);
        $this->assertSame(1, $attempts->where('status', 'PENDING')->count());
        $this->assertSame(1, $attempts->where('status', 'EXPIRED')->count());
    }

    public function test_a_paid_invoice_cannot_be_paid_again(): void
    {
        $this->fakeGateway();
        $merchant = $this->merchant();
        $channel = $this->qrisChannel();
        $invoice = $this->subscribe($merchant, Service::factory()->create(), $channel);

        Sanctum::actingAs($this->internal(), ['access-api']);
        $this->postJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/confirm")->assertOk();

        Sanctum::actingAs($merchant, ['access-api']);
        $this->postJson("/api/v1/payment-admin/service-invoices/{$invoice->id}/pay", [
            'payment_channel_id' => $channel->id,
        ])->assertStatus(422);
    }

    /**
     * A manually-confirmed invoice never gets a ServiceInvoicePayment row, so
     * its revenue must be booked off the invoice's own amount, keyed on the
     * invoice number rather than an attempt reference.
     */
    public function test_manual_confirm_books_service_revenue_from_the_invoice_amount(): void
    {
        $this->fakeGateway();
        $invoice = $this->subscribe($this->merchant(), Service::factory()->create(['selling_price' => 150000]), $this->qrisChannel());

        Sanctum::actingAs($this->internal(), ['access-api']);
        $this->postJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/confirm")->assertOk();

        $this->assertDatabaseHas('platform_mutations', [
            'type' => 'service_revenue',
            'reference' => $invoice->invoice_number,
            'amount' => (int) $invoice->amount,
        ]);
        $this->assertSame(
            1,
            PlatformMutation::where('type', 'service_revenue')->where('reference', $invoice->invoice_number)->count(),
        );
    }

    public function test_the_channel_list_offers_only_gateway_methods(): void
    {
        $this->qrisChannel();
        $this->vaChannel();
        $this->qrisChannel(['payment_type' => 'balance', 'channel_code' => 'balance', 'name' => 'Saldo']);
        $this->qrisChannel(['channel_code' => 'off_qris', 'name' => 'Nonaktif', 'is_active' => false]);

        Sanctum::actingAs($this->merchant(), ['access-api']);

        $codes = collect($this->getJson('/api/v1/payment-admin/payment-channels')->assertOk()->json('data'))
            ->pluck('channel_code');

        $this->assertEqualsCanonicalizing(['qris', 'bca_va'], $codes->all());
    }

    /**
     * A double-tap must not open two payments for one bill — and the guard is
     * keyed on (invoice, channel), so it also catches re-pressing the same
     * method straight after subscribing.
     */
    public function test_a_duplicate_submit_is_rejected(): void
    {
        $this->fakeGateway();
        $merchant = $this->merchant();
        $qris = $this->qrisChannel();
        $invoice = $this->subscribe($merchant, Service::factory()->create(), $qris);

        Sanctum::actingAs($merchant, ['access-api']);

        // Same channel the bill was just opened with: still inside the window.
        $this->postJson("/api/v1/payment-admin/service-invoices/{$invoice->id}/pay", [
            'payment_channel_id' => $qris->id,
        ])->assertStatus(422);

        // A different method is a different intent, so it goes through — then
        // repeating *that* is the duplicate.
        $va = ['payment_channel_id' => $this->vaChannel()->id];
        $this->postJson("/api/v1/payment-admin/service-invoices/{$invoice->id}/pay", $va)->assertOk();
        $this->postJson("/api/v1/payment-admin/service-invoices/{$invoice->id}/pay", $va)->assertStatus(422);
    }

    public function test_the_gateway_is_asked_to_collect_the_total_not_the_bill(): void
    {
        $this->fakeGateway();
        $merchant = $this->merchant();

        $this->subscribe(
            $merchant,
            Service::factory()->create(['selling_price' => 100000]),
            $this->qrisChannel(['fee_flat' => 2500]),
        );

        // The amount is encrypted inside en_data, so assert on what we froze:
        // the attempt row is what the reference was opened for.
        $attempt = ServiceInvoicePayment::firstOrFail();
        $this->assertSame(102500, $attempt->total);
        Http::assertSentCount(1);
    }

    /**
     * A recovered payment is money kita actually received, so the revenue has to
     * be booked on the same reference the webhook would have used — otherwise the
     * client is served, the bill reads PAID, and the income never becomes
     * withdrawable, with nothing on the row to say so afterwards.
     */
    public function test_the_sweep_books_service_revenue_for_the_payment_it_recovers(): void
    {
        $this->fakeGateway();
        $invoice = $this->subscribe($this->merchant(), Service::factory()->create(['selling_price' => 150000]), $this->qrisChannel());
        $attempt = ServiceInvoicePayment::firstOrFail();

        $attempt->forceFill(['created_at' => now()->subDay()])->save();

        Http::swap(new HttpFactory);
        Http::preventStrayRequests();
        Http::fake(['*' => Http::response(['code' => 0, 'data' => ['status' => 'success']])]);

        $this->artisan('service-payments:sync-expired')->assertSuccessful();

        $this->assertDatabaseHas('platform_mutations', [
            'type' => 'service_revenue',
            'reference' => $attempt->reference_id,
            'amount' => (int) $invoice->amount,
        ]);
        $this->assertSame(
            1,
            PlatformMutation::where('type', 'service_revenue')->where('reference', $attempt->reference_id)->count(),
        );
    }

    /**
     * A hand-confirmed bill already booked its revenue under the invoice number.
     * The sweep then finds nothing left to settle and must book nothing — the
     * two references are what keep the paths from doubling up.
     */
    public function test_the_sweep_does_not_book_revenue_for_a_bill_already_confirmed_by_hand(): void
    {
        $this->fakeGateway();
        $invoice = $this->subscribe($this->merchant(), Service::factory()->create(['selling_price' => 150000]), $this->qrisChannel());
        $attempt = ServiceInvoicePayment::firstOrFail();

        Sanctum::actingAs($this->internal(), ['access-api']);
        $this->postJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/confirm")->assertOk();

        $attempt->forceFill(['created_at' => now()->subDay()])->save();

        Http::swap(new HttpFactory);
        Http::preventStrayRequests();
        Http::fake(['*' => Http::response(['code' => 0, 'data' => ['status' => 'success']])]);

        $this->artisan('service-payments:sync-expired')->assertSuccessful();

        $this->assertSame(
            0,
            PlatformMutation::where('type', 'service_revenue')->where('reference', $attempt->reference_id)->count(),
        );
        $this->assertSame(1, PlatformMutation::where('type', 'service_revenue')->count());
    }

    /**
     * The sweep is for a webhook that never arrived, not one that is merely slow.
     * Because both paths credit the ATTEMPT's reference, a callback landing after
     * the sweep finds the attempt settled and books nothing.
     */
    public function test_a_late_webhook_after_the_sweep_does_not_double_book(): void
    {
        config(['services.monetapay.token' => 'test-token']);

        $this->fakeGateway();
        $invoice = $this->subscribe($this->merchant(), Service::factory()->create(['selling_price' => 150000]), $this->qrisChannel());
        $attempt = ServiceInvoicePayment::firstOrFail();

        $attempt->forceFill(['created_at' => now()->subDay()])->save();

        Http::swap(new HttpFactory);
        Http::preventStrayRequests();
        Http::fake(['*' => Http::response(['code' => 0, 'data' => ['status' => 'success']])]);

        $this->artisan('service-payments:sync-expired')->assertSuccessful();

        // The webhook arrives late, with a perfectly valid signature.
        $this->postJson('/api/v1/payment/callback', $this->signedPayload($attempt->reference_id, (int) $attempt->total))
            ->assertOk();

        $this->assertSame(1, PlatformMutation::where('type', 'service_revenue')->count());
        $this->assertDatabaseCount('service_subscriptions', 1);
    }

    /**
     * The recovery half of the sweep is the point: a client whose webhook was
     * lost has genuinely paid, and would otherwise sit unpaid forever.
     */
    public function test_the_sweep_recovers_a_payment_whose_webhook_was_lost(): void
    {
        $this->fakeGateway();
        $merchant = $this->merchant();
        $invoice = $this->subscribe($merchant, Service::factory()->create(['duration_days' => 30]), $this->qrisChannel());
        $attempt = ServiceInvoicePayment::firstOrFail();

        // Push the attempt past its channel window.
        $attempt->forceFill(['created_at' => now()->subDay()])->save();

        Http::swap(new HttpFactory);
        Http::preventStrayRequests();
        Http::fake(['*' => Http::response(['code' => 0, 'data' => ['status' => 'success']])]);

        $this->artisan('service-payments:sync-expired')->assertSuccessful();

        $this->assertSame('PAID', $attempt->fresh()->status);
        $this->assertSame(ServiceInvoiceStatus::PAID, $invoice->fresh()->status);
        $this->assertDatabaseCount('service_subscriptions', 1);
    }

    public function test_the_sweep_expires_an_attempt_the_gateway_never_collected(): void
    {
        $this->fakeGateway();
        $invoice = $this->subscribe($this->merchant(), Service::factory()->create(), $this->qrisChannel());
        $attempt = ServiceInvoicePayment::firstOrFail();
        $attempt->forceFill(['created_at' => now()->subDay()])->save();

        Http::swap(new HttpFactory);
        Http::preventStrayRequests();
        Http::fake(['*' => Http::response(['code' => 0, 'data' => ['status' => 'expired']])]);

        $this->artisan('service-payments:sync-expired')->assertSuccessful();

        $this->assertSame('EXPIRED', $attempt->fresh()->status);
        $this->assertSame(ServiceInvoiceStatus::UNPAID, $invoice->fresh()->status);
        $this->assertDatabaseCount('service_subscriptions', 0);
    }

    public function test_the_sweep_writes_nothing_on_a_dry_run(): void
    {
        $this->fakeGateway();
        $this->subscribe($this->merchant(), Service::factory()->create(), $this->qrisChannel());
        $attempt = ServiceInvoicePayment::firstOrFail();
        $attempt->forceFill(['created_at' => now()->subDay()])->save();

        Http::swap(new HttpFactory);
        Http::preventStrayRequests();
        Http::fake(['*' => Http::response(['code' => 0, 'data' => ['status' => 'success']])]);

        $this->artisan('service-payments:sync-expired', ['--dry-run' => true])->assertSuccessful();

        $this->assertSame('PENDING', $attempt->fresh()->status);
        $this->assertDatabaseCount('service_subscriptions', 0);
    }

    /** An attempt still inside its window must be left alone. */
    public function test_the_sweep_leaves_a_fresh_attempt_alone(): void
    {
        $this->fakeGateway();
        $this->subscribe($this->merchant(), Service::factory()->create(), $this->qrisChannel());

        $this->artisan('service-payments:sync-expired')->assertSuccessful();

        $this->assertSame('PENDING', ServiceInvoicePayment::firstOrFail()->status);
    }
}
