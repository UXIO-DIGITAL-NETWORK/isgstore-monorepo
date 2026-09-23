<?php

namespace Tests\Feature;

use App\Enums\ServiceInvoiceStatus;
use App\Enums\WithdrawalStatus;
use App\Events\NotificationCreated;
use App\Events\ServiceInvoiceUpdated;
use App\Events\WithdrawalStatusUpdated;
use App\Models\Notification;
use App\Models\Role;
use App\Models\ServiceInvoice;
use App\Models\User;
use App\Models\Withdrawal;
use Illuminate\Contracts\Broadcasting\Broadcaster;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Pusher\PusherException;
use Tests\TestCase;

/**
 * The observers mirror TransactionObserver: any created row or a status change
 * fires exactly one realtime event; a non-status update fires none. These lock
 * the wiring (#[ObservedBy] + the event) rather than re-testing broadcasting.
 */
class RealtimeBroadcastTest extends TestCase
{
    use RefreshDatabase;

    private function user(): User
    {
        return User::factory()->create(['role_id' => Role::factory()->create()->id]);
    }

    public function test_withdrawal_broadcasts_on_create_and_status_change_only(): void
    {
        Event::fake([WithdrawalStatusUpdated::class]);
        $merchant = $this->user();

        $withdrawal = Withdrawal::create([
            'withdrawal_number' => 'WD-TEST-1',
            'merchant_id' => $merchant->id,
            'amount' => 100000,
            'fee' => 1665,
            'nett' => 98335,
            'bank_code' => 'BCA',
            'account_number' => '1234567890',
            'account_name' => 'Test Merchant',
            'status' => WithdrawalStatus::PENDING,
        ]);
        Event::assertDispatched(WithdrawalStatusUpdated::class, 1);

        $withdrawal->update(['status' => WithdrawalStatus::PROCESSING]);
        Event::assertDispatched(WithdrawalStatusUpdated::class, 2);

        // A non-status write must not broadcast.
        $withdrawal->update(['account_name' => 'Renamed']);
        Event::assertDispatched(WithdrawalStatusUpdated::class, 2);
    }

    public function test_service_invoice_broadcasts_on_create_and_status_change_only(): void
    {
        Event::fake([ServiceInvoiceUpdated::class]);

        $invoice = ServiceInvoice::factory()->create([
            'merchant_id' => $this->user()->id,
            'status' => ServiceInvoiceStatus::UNPAID,
        ]);
        Event::assertDispatched(ServiceInvoiceUpdated::class, 1);

        $invoice->update(['status' => ServiceInvoiceStatus::PAID]);
        Event::assertDispatched(ServiceInvoiceUpdated::class, 2);

        $invoice->update(['notes' => 'no status change']);
        Event::assertDispatched(ServiceInvoiceUpdated::class, 2);
    }

    /**
     * The bill path is inline end to end: the Hub's poke issues the invoice
     * inside its own HTTP request and answers with the verdict, so the last leg
     * must not hand that wait back to a queue worker — which is exactly what a
     * plain ShouldBroadcast does, by enqueuing a BroadcastEvent job.
     */
    public function test_the_invoice_event_broadcasts_inline_rather_than_through_a_worker(): void
    {
        $event = new ServiceInvoiceUpdated(new ServiceInvoice);

        $this->assertInstanceOf(ShouldBroadcastNow::class, $event);
        $this->assertInstanceOf(ShouldRescue::class, $event);
    }

    /**
     * The property that matters operationally: a Pusher outage degrades the
     * merchant's page to its polling fallback, it does NOT fail the request that
     * issued the bill.
     *
     * A broadcaster that always throws stands in for the outage. Reaching the
     * alert assertion is half the result (nothing propagated), and the alert is
     * the other half — a silent fallback is how the queued broadcast this
     * replaces managed to hide a dead worker from everyone.
     */
    public function test_a_dead_broadcaster_cannot_fail_the_invoice_it_announces(): void
    {
        Broadcast::extend('exploding', fn () => new class implements Broadcaster
        {
            public function auth($request) {}

            public function validAuthenticationResponse($request, $result) {}

            public function broadcast(array $channels, $event, array $payload = [])
            {
                throw new PusherException('Pusher is unreachable');
            }
        });

        Http::fake();
        config([
            'broadcasting.default' => 'exploding',
            'broadcasting.connections.exploding' => ['driver' => 'exploding'],
            'services.discord.webhook_log_url' => 'https://discord.test/webhook',
        ]);

        $invoice = ServiceInvoice::factory()->create([
            'merchant_id' => $this->user()->id,
            'status' => ServiceInvoiceStatus::UNPAID,
        ]);

        // The same call the observer makes, minus the after-commit deferral that
        // this suite's wrapping transaction would hold past the assertion.
        Broadcast::queue(new ServiceInvoiceUpdated($invoice));

        Http::assertSent(fn ($request) => str_contains(
            (string) ($request['embeds'][0]['description'] ?? ''),
            'Push realtime gagal',
        ));
    }

    public function test_notification_broadcasts_on_create(): void
    {
        Event::fake([NotificationCreated::class]);
        $user = $this->user();

        Notification::create([
            'user_id' => $user->id,
            'type' => 'withdrawal_request',
            'title' => 'New withdrawal',
            'message' => 'A merchant requested a payout.',
        ]);

        Event::assertDispatched(NotificationCreated::class, 1);
    }
}
