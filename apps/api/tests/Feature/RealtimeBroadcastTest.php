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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
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
