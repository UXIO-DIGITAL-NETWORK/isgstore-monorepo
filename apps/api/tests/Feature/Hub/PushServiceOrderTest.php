<?php

declare(strict_types=1);

namespace Tests\Feature\Hub;

use App\Actions\Service\ActivateServiceSubscriptionAction;
use App\Enums\ServiceInvoiceStatus;
use App\Jobs\PushServiceOrderToHubJob;
use App\Models\Service;
use App\Models\ServiceInvoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use RuntimeException;
use Tests\Feature\PaymentPage\Concerns\PaysServiceInvoices;
use Tests\TestCase;

/**
 * The site records a merchant's service purchase to the Hub in real time, but
 * only as a fire-and-forget queued job that can never fail the purchase — and
 * only when the Hub is enabled. The 5-minute pull is the backstop.
 */
class PushServiceOrderTest extends TestCase
{
    use PaysServiceInvoices;
    use RefreshDatabase;

    private function enableHub(): void
    {
        config(['services.hub.enabled' => true, 'services.hub.push_orders' => true]);
    }

    private function invoiceFor(User $merchant, string $status = ServiceInvoiceStatus::UNPAID->value): ServiceInvoice
    {
        return ServiceInvoice::factory()->create([
            'merchant_id' => $merchant->id,
            'service_id' => Service::factory()->create()->id,
            'status' => $status,
        ]);
    }

    public function test_it_dispatches_an_unpaid_push_when_an_order_is_placed(): void
    {
        $this->enableHub();
        $this->fakeGateway();
        Queue::fake();

        $merchant = $this->merchant();
        $invoice = $this->subscribe($merchant, Service::factory()->create());

        Queue::assertPushed(
            PushServiceOrderToHubJob::class,
            fn (PushServiceOrderToHubJob $job) => $job->invoice->invoice_number === $invoice->invoice_number,
        );
    }

    public function test_it_dispatches_nothing_on_a_standalone_deployment(): void
    {
        config(['services.hub.enabled' => false]);
        $this->fakeGateway();
        Queue::fake();

        $this->subscribe($this->merchant(), Service::factory()->create());

        Queue::assertNotPushed(PushServiceOrderToHubJob::class);
    }

    public function test_it_dispatches_a_paid_push_on_activation(): void
    {
        $this->enableHub();
        Queue::fake();

        $merchant = $this->merchant();
        // The action is the second half of the pay transaction: the caller has
        // already flipped the invoice to PAID.
        $invoice = $this->invoiceFor($merchant, ServiceInvoiceStatus::PAID->value);

        app(ActivateServiceSubscriptionAction::class)->execute($invoice);

        Queue::assertPushed(
            PushServiceOrderToHubJob::class,
            fn (PushServiceOrderToHubJob $job) => $job->invoice->is($invoice),
        );
    }

    public function test_it_dispatches_an_expired_push_when_the_sweep_runs(): void
    {
        $this->enableHub();
        Queue::fake();

        $merchant = $this->merchant();
        $invoice = $this->invoiceFor($merchant);
        $invoice->update(['due_at' => now()->subDay()]);

        $this->artisan('services:expire')->assertSuccessful();

        $this->assertSame(ServiceInvoiceStatus::EXPIRED, $invoice->fresh()->status);
        Queue::assertPushed(
            PushServiceOrderToHubJob::class,
            fn (PushServiceOrderToHubJob $job) => $job->invoice->invoice_number === $invoice->invoice_number,
        );
    }

    public function test_a_failed_push_never_mutates_the_invoice(): void
    {
        $merchant = $this->merchant();
        $invoice = $this->invoiceFor($merchant);

        (new PushServiceOrderToHubJob($invoice))->failed(new RuntimeException('hub down'));

        $this->assertSame(ServiceInvoiceStatus::UNPAID, $invoice->fresh()->status);
    }
}
