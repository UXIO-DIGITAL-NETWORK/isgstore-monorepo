<?php

declare(strict_types=1);

namespace Tests\Feature\PaymentPage;

use App\Enums\ServiceInvoiceStatus;
use App\Models\PlatformMutation;
use App\Models\Service;
use App\Models\ServiceInvoice;
use App\Models\ServiceInvoicePayment;
use App\Support\Ledger\ServiceRevenueLedger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\PaymentPage\Concerns\PaysServiceInvoices;
use Tests\TestCase;

/**
 * `service-revenue:backfill` — booking money the recovery sweep received but
 * never recorded.
 *
 * The shape of the loss is the whole problem: a settled attempt and a PAID bill
 * look identical whether or not the revenue reached the ledger, so the only way
 * to find one is to look for the ABSENCE of the credit. What matters here is
 * therefore not just that it finds them, but that it does not invent any.
 */
class ServiceRevenueBackfillTest extends TestCase
{
    use PaysServiceInvoices;
    use RefreshDatabase;

    /**
     * Exactly what the sweep used to leave behind: the attempt settled, the bill
     * PAID, and no revenue mutation anywhere.
     *
     * @return array{0: ServiceInvoicePayment, 1: ServiceInvoice}
     */
    private function lostAttempt(int $price = 150000): array
    {
        $this->fakeGateway();

        $invoice = $this->subscribe(
            $this->merchant(),
            Service::factory()->create(['selling_price' => $price]),
            $this->qrisChannel(),
        );

        $attempt = ServiceInvoicePayment::firstOrFail();
        $attempt->update(['status' => 'PAID', 'paid_at' => now()]);
        $invoice->update(['status' => ServiceInvoiceStatus::PAID, 'verified_at' => now()]);

        return [$attempt, $invoice];
    }

    public function test_it_credits_the_revenue_for_an_attempt_that_was_never_booked(): void
    {
        [$attempt, $invoice] = $this->lostAttempt(150000);

        $this->artisan('service-revenue:backfill')->assertSuccessful();

        $this->assertDatabaseHas('platform_mutations', [
            'type' => 'service_revenue',
            'reference' => $attempt->reference_id,
            'amount' => 150000,
        ]);
        $this->assertSame(1, PlatformMutation::where('type', 'service_revenue')->count());
        $this->assertNotNull($invoice->fresh());
    }

    public function test_running_it_twice_books_the_revenue_once(): void
    {
        [$attempt] = $this->lostAttempt();

        $this->artisan('service-revenue:backfill')->assertSuccessful();
        $this->artisan('service-revenue:backfill')->assertSuccessful();

        $this->assertSame(
            1,
            PlatformMutation::where('type', 'service_revenue')
                ->where('reference', $attempt->reference_id)
                ->count(),
        );
    }

    public function test_a_dry_run_writes_nothing(): void
    {
        $this->lostAttempt();

        $this->artisan('service-revenue:backfill', ['--dry-run' => true])->assertSuccessful();

        $this->assertSame(0, PlatformMutation::where('type', 'service_revenue')->count());
    }

    /**
     * The one state that reaches the query without being a loss: the webhook
     * settled an attempt whose bill had ALREADY been confirmed by hand, so it
     * credited zero and left no attempt-level mutation — while the bill itself
     * was credited under its own number. Booking it again is the exact mistake
     * this command must not make.
     */
    public function test_it_refuses_an_attempt_whose_bills_were_already_credited_by_number(): void
    {
        $this->fakeGateway();

        $invoice = $this->subscribe(
            $this->merchant(),
            Service::factory()->create(['selling_price' => 150000]),
            $this->qrisChannel(),
        );
        $attempt = ServiceInvoicePayment::firstOrFail();

        Sanctum::actingAs($this->internal(), ['access-api']);
        $this->postJson("/api/v1/payment-internal/service-invoices/{$invoice->id}/confirm")->assertOk();

        // The attempt settles afterwards, on a bill that was already paid.
        $attempt->update(['status' => 'PAID', 'paid_at' => now()]);

        $this->artisan('service-revenue:backfill')->assertSuccessful();

        // Still exactly the one credit the manual confirm booked — nothing under
        // the attempt's reference.
        $this->assertSame(1, PlatformMutation::where('type', 'service_revenue')->count());
        $this->assertSame(
            0,
            PlatformMutation::where('type', 'service_revenue')->where('reference', $attempt->reference_id)->count(),
        );
    }

    /** A bill settled the normal way is already booked, so there is nothing to find. */
    public function test_it_leaves_an_already_credited_attempt_alone(): void
    {
        $this->fakeGateway();

        $invoice = $this->subscribe(
            $this->merchant(),
            Service::factory()->create(['selling_price' => 150000]),
            $this->qrisChannel(),
        );
        $attempt = ServiceInvoicePayment::firstOrFail();
        $attempt->update(['status' => 'PAID', 'paid_at' => now()]);
        $invoice->update(['status' => ServiceInvoiceStatus::PAID, 'verified_at' => now()]);

        // What the webhook or the fixed sweep books.
        ServiceRevenueLedger::credit(
            amount: 150000,
            reference: $attempt->reference_id,
            description: 'Layanan '.$invoice->invoice_number,
        );

        $this->artisan('service-revenue:backfill')->assertSuccessful();

        $this->assertSame(1, PlatformMutation::where('type', 'service_revenue')->count());
    }
}
