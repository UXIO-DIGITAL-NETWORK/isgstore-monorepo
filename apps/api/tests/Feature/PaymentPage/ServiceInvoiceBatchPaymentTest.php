<?php

declare(strict_types=1);

namespace Tests\Feature\PaymentPage;

use App\Enums\ServiceInvoiceStatus;
use App\Jobs\PushLicenceRenewalJob;
use App\Models\PlatformMutation;
use App\Models\Service;
use App\Models\ServiceInvoice;
use App\Models\ServiceInvoicePayment;
use App\Models\ServiceInvoicePaymentItem;
use App\Models\ServiceSubscription;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\PaymentPage\Concerns\PaysServiceInvoices;
use Tests\TestCase;

/**
 * Paying several service bills in one Monetapay attempt.
 *
 * The bills stay one-per-service, because each buys its own period; the PAYMENT
 * is what spans them. Everything pinned here is a way real money goes wrong:
 * a fee charged per bill instead of once, a rupiah that exists on the attempt
 * but on none of its items, two live payables for one bill (this app has no
 * refund path for a service invoice), and a batch total reported against a
 * single bill in a screen the client reads.
 */
class ServiceInvoiceBatchPaymentTest extends TestCase
{
    use PaysServiceInvoices;
    use RefreshDatabase;

    private User $merchant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->fakeGateway();
        config(['services.monetapay.token' => 'test-token']);

        $this->merchant = $this->merchant();
    }

    private function bill(string $code, int $amount): ServiceInvoice
    {
        $service = Service::factory()->create([
            'code' => $code, 'name' => ucfirst($code), 'selling_price' => $amount, 'duration_days' => 30,
        ]);

        return ServiceInvoice::create([
            'invoice_number' => 'SINV-'.strtoupper($code),
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'service_name' => ucfirst($code),
            'amount' => $amount,
            'duration_days' => 30,
            'status' => ServiceInvoiceStatus::UNPAID,
            'due_at' => now()->addDays(3),
        ]);
    }

    /** @param list<ServiceInvoice> $invoices */
    private function payBatch(array $invoices, ?int $channelId = null)
    {
        Sanctum::actingAs($this->merchant, ['access-api']);

        return $this->postJson('/api/v1/payment-admin/service-invoices/pay-batch', [
            'invoice_ids' => array_map(fn (ServiceInvoice $i) => $i->id, $invoices),
            'payment_channel_id' => $channelId ?? $this->qrisChannel(['fee_flat' => 2500, 'fee_percent' => 1])->id,
        ]);
    }

    public function test_the_channel_fee_is_charged_once_on_the_sum_not_once_per_bill(): void
    {
        $a = $this->bill('domain', 100000);
        $b = $this->bill('email', 200000);
        $c = $this->bill('whatsapp', 300000);

        $this->payBatch([$a, $b, $c])->assertCreated();

        $attempt = ServiceInvoicePayment::firstOrFail();

        // 2.500 + 1% of 600.000 = 8.500. Three flat fees would be 7.500 more,
        // charged to a client for the convenience of paying once.
        $this->assertSame(600000, (int) $attempt->amount);
        $this->assertSame(8500, (int) $attempt->admin_fee);
        $this->assertSame(608500, (int) $attempt->total);
        $this->assertSame(3, (int) $attempt->invoice_count);
        // Null for a batch: no single bill owns this attempt, and a column that
        // named one would be a schema that lies.
        $this->assertNull($attempt->service_invoice_id);
    }

    public function test_the_fee_shares_sum_to_exactly_what_was_charged(): void
    {
        // Deliberately awkward: 1% of 333.333 does not divide into three shares.
        $invoices = [$this->bill('domain', 111111), $this->bill('email', 111111), $this->bill('whatsapp', 111111)];

        $this->payBatch($invoices)->assertCreated();

        $attempt = ServiceInvoicePayment::firstOrFail();
        $items = ServiceInvoicePaymentItem::all();

        $this->assertCount(3, $items);
        // A rupiah on the attempt that exists on none of its items is a gap
        // nobody finds until somebody balances the books.
        $this->assertSame((int) $attempt->admin_fee, (int) $items->sum('admin_fee'));
        $this->assertSame((int) $attempt->amount, (int) $items->sum('amount'));
    }

    public function test_opening_another_payment_expires_every_attempt_that_overlaps_it(): void
    {
        $a = $this->bill('domain', 100000);
        $b = $this->bill('email', 200000);

        $this->payBatch([$a, $b])->assertCreated();
        $batch = ServiceInvoicePayment::firstOrFail();

        // Paying one of them on its own must kill the batch QR. Two live
        // payables for one bill means the client can pay for it twice, and there
        // is no refund path for a service invoice anywhere in this app.
        Sanctum::actingAs($this->merchant, ['access-api']);
        $this->postJson("/api/v1/payment-admin/service-invoices/{$a->id}/pay", [
            'payment_channel_id' => $this->vaChannel()->id,
        ])->assertOk();

        $this->assertSame('EXPIRED', $batch->fresh()->status);
    }

    public function test_bills_belonging_to_another_client_are_not_found(): void
    {
        $mine = $this->bill('domain', 100000);

        $other = $this->merchant();
        $theirs = ServiceInvoice::create([
            'invoice_number' => 'SINV-THEIRS',
            'merchant_id' => $other->id,
            'service_id' => $mine->service_id,
            'service_name' => 'Domain',
            'amount' => 100000,
            'duration_days' => 30,
            'status' => ServiceInvoiceStatus::UNPAID,
            'due_at' => now()->addDays(3),
        ]);

        $this->payBatch([$mine, $theirs])->assertNotFound();
        $this->assertSame(0, ServiceInvoicePayment::count());
    }

    public function test_a_batch_callback_settles_every_bill_and_books_the_bills_as_revenue_once(): void
    {
        Bus::fake([PushLicenceRenewalJob::class]);

        // The push is gated on the site being Hub-managed; without these the
        // job never leaves and the assertion below would pass for the wrong
        // reason.
        config(['services.hub.enabled' => true, 'services.hub.managed_licence' => true]);

        Setting::updateOrCreate(
            ['group' => 'payment', 'key' => 'website_service_code'],
            ['value' => 'website', 'type' => 'string'],
        );

        $website = $this->bill('website', 500000);
        $domain = $this->bill('domain', 100000);

        $this->payBatch([$website, $domain])->assertCreated();
        $attempt = ServiceInvoicePayment::firstOrFail();

        $payload = $this->signedPayload($attempt->reference_id, (int) $attempt->total);
        $this->postJson('/api/v1/payment/callback', $payload)->assertOk();
        // A redelivery must not open a second period for anything.
        $this->postJson('/api/v1/payment/callback', $payload)->assertOk();

        $this->assertSame(ServiceInvoiceStatus::PAID, $website->fresh()->status);
        $this->assertSame(ServiceInvoiceStatus::PAID, $domain->fresh()->status);
        $this->assertSame(2, ServiceSubscription::count());

        // One credit, under the attempt's reference, for the sum of the BILLS —
        // the channel fee buys the gateway's cut and is not withdrawable income.
        $revenue = PlatformMutation::where('type', 'service_revenue')->get();
        $this->assertCount(1, $revenue);
        $this->assertSame(600000, (int) $revenue->first()->amount);

        // Exactly one licence renewal pushed: the website bill inside the batch,
        // and nothing else. A domain renewal must never extend the site's term.
        Bus::assertDispatchedTimes(PushLicenceRenewalJob::class, 1);
    }

    public function test_each_bill_reports_its_own_share_not_the_batch_total(): void
    {
        $a = $this->bill('domain', 100000);
        $b = $this->bill('email', 500000);

        $this->payBatch([$a, $b])->assertCreated();

        Sanctum::actingAs($this->merchant, ['access-api']);
        $shown = $this->getJson("/api/v1/payment-admin/service-invoices/{$a->id}")
            ->assertOk()->json('data.payment');

        // Without the pivot this page would tell the client their Rp 100.000
        // bill cost Rp 606.000.
        $this->assertSame(100000, $shown['amount']);
        $this->assertSame(2, $shown['batch']['invoice_count']);
        $this->assertSame(608500, $shown['batch']['total']);
    }

    public function test_the_batch_payment_page_lists_every_bill_it_covers(): void
    {
        $a = $this->bill('domain', 100000);
        $b = $this->bill('email', 500000);

        $this->payBatch([$a, $b])->assertCreated();
        $attempt = ServiceInvoicePayment::firstOrFail();

        Sanctum::actingAs($this->merchant, ['access-api']);
        $data = $this->getJson("/api/v1/payment-admin/service-payments/{$attempt->reference_id}")
            ->assertOk()->json('data');

        $this->assertSame(2, $data['invoice_count']);
        $this->assertCount(2, $data['invoices']);
        $this->assertSame(608500, $data['total']);
    }

    public function test_the_transaction_feed_attributes_each_bill_its_own_share(): void
    {
        $a = $this->bill('domain', 100000);
        $b = $this->bill('email', 500000);

        $this->payBatch([$a, $b])->assertCreated();
        $attempt = ServiceInvoicePayment::firstOrFail();

        $this->postJson('/api/v1/payment/callback', $this->signedPayload($attempt->reference_id, (int) $attempt->total))
            ->assertOk();

        // The internal view, because `amount_total` and `admin_fee` are the
        // platform figures and only that view carries them.
        Sanctum::actingAs($this->internal(), ['access-api']);
        $rows = collect($this->getJson('/api/v1/payment-internal/transactions')->assertOk()->json('data.data'))
            ->keyBy('invoice_number');

        // Each bill once — not once per attempt — and each carrying its own
        // share. Joined on the attempt instead of the pivot, both rows would
        // report the whole batch and the statement would not sum to what the
        // client paid.
        $this->assertCount(2, $rows);
        $this->assertSame(
            (int) $attempt->total,
            (int) $rows['SINV-DOMAIN']['amount_total'] + (int) $rows['SINV-EMAIL']['amount_total'],
        );
    }

    public function test_the_latest_payment_relation_survives_eager_loading(): void
    {
        $a = $this->bill('domain', 100000);

        Sanctum::actingAs($this->merchant, ['access-api']);
        $this->postJson("/api/v1/payment-admin/service-invoices/{$a->id}/pay", [
            'payment_channel_id' => $this->qrisChannel()->id,
        ])->assertOk();
        $this->postJson("/api/v1/payment-admin/service-invoices/{$a->id}/pay", [
            'payment_channel_id' => $this->vaChannel()->id,
        ])->assertOk();

        // hasOneThrough + latest() has no `latestOfMany` form, so the "newest
        // per parent" guarantee rests on eager loading matching the first
        // ordered row. Pinned because a refactor breaks it silently.
        $shown = $this->getJson("/api/v1/payment-admin/service-invoices/{$a->id}")
            ->assertOk()->json('data.payment');

        $this->assertSame('virtual_account', $shown['type']);
    }
}
