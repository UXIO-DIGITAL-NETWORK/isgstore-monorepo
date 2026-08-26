<?php

namespace Tests\Feature\PaymentPage;

use App\Actions\Service\ActivateServiceSubscriptionAction;
use App\Actions\Settlement\SettleMerchantTransactionAction;
use App\Actions\Withdrawal\CreateWithdrawalRequestAction;
use App\DTOs\Withdrawal\CreateWithdrawalDTO;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceInvoice;
use App\Models\ServiceSubscription;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The internal team's in-app notifications: the three "client transaction"
 * triggers, the H-7/H-3 expiry reminders, and the caller-scoped API.
 */
class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private function internal(): User
    {
        return User::factory()->create([
            'role_id' => Role::firstOrCreate(['name' => 'Payment-Internal'])->id,
        ]);
    }

    private function merchant(int $balance = 0): User
    {
        return User::factory()->create([
            'role_id' => Role::firstOrCreate(['name' => 'Payment-Admin'])->id,
            'balance' => $balance,
        ]);
    }

    // ── Triggers ────────────────────────────────────────────────────────────

    public function test_settling_a_merchant_sale_notifies_every_internal_user(): void
    {
        $internalA = $this->internal();
        $internalB = $this->internal();
        $merchant = $this->merchant();

        $transaction = Transaction::factory()->create([
            'merchant_id' => $merchant->id,
            'amount_base' => 60000,
            'amount_fee' => 3000,
            'amount_total' => 63000,
            'status' => 'PAID',
        ]);
        Payment::factory()->create([
            'transaction_id' => $transaction->id,
            'gross_amount' => 63000,
            'admin_fee' => 3000,
            'gateway_fee' => 1000,
            'status' => '3',
        ]);

        app(SettleMerchantTransactionAction::class)->execute($transaction->fresh());

        foreach ([$internalA, $internalB] as $user) {
            $this->assertDatabaseHas('notifications', [
                'user_id' => $user->id,
                'type' => 'transaction_sale',
            ]);
        }
        $this->assertSame(2, Notification::where('type', 'transaction_sale')->count());
    }

    public function test_a_repeated_settlement_does_not_re_notify(): void
    {
        $this->internal();
        $merchant = $this->merchant();

        $transaction = Transaction::factory()->create([
            'merchant_id' => $merchant->id,
            'amount_base' => 60000,
            'amount_fee' => 3000,
            'amount_total' => 63000,
            'status' => 'PAID',
        ]);
        Payment::factory()->create([
            'transaction_id' => $transaction->id,
            'gross_amount' => 63000,
            'admin_fee' => 3000,
            'gateway_fee' => 1000,
            'status' => '3',
        ]);

        $action = app(SettleMerchantTransactionAction::class);
        $action->execute($transaction->fresh());
        $action->execute($transaction->fresh()); // retried webhook

        // The idempotency guard short-circuits before the notify, so no dupe.
        $this->assertSame(1, Notification::where('type', 'transaction_sale')->count());
    }

    public function test_activating_a_paid_service_notifies_internal(): void
    {
        $internal = $this->internal();
        $merchant = $this->merchant();
        $service = Service::factory()->create();

        $invoice = ServiceInvoice::factory()->create([
            'merchant_id' => $merchant->id,
            'service_id' => $service->id,
            'amount' => 250000,
            'duration_days' => 30,
        ]);

        app(ActivateServiceSubscriptionAction::class)->execute($invoice);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $internal->id,
            'type' => 'service_payment',
        ]);
    }

    public function test_creating_a_withdrawal_notifies_internal(): void
    {
        $internal = $this->internal();
        $merchant = $this->merchant();

        // The withdrawable balance is derived from sales, so seed a paid sale to
        // cover the request — backdated past the holding period so it is settled.
        Transaction::factory()->create([
            'merchant_id' => $merchant->id,
            'amount_base' => 100000,
            'amount_fee' => 0,
            'amount_total' => 100000,
            'status' => 'PAID',
            'created_at' => now()->subDays(5),
        ]);

        app(CreateWithdrawalRequestAction::class)->execute(new CreateWithdrawalDTO(
            merchantId: $merchant->id,
            amount: 50000,
            bankCode: 'BCA',
            accountNumber: '1234567890',
            accountName: 'Client',
        ));

        $this->assertDatabaseHas('notifications', [
            'user_id' => $internal->id,
            'type' => 'withdrawal_request',
        ]);
    }

    // ── Expiry reminders ─────────────────────────────────────────────────────

    public function test_expiring_command_raises_h7_and_h3_and_is_idempotent(): void
    {
        $internal = $this->internal();
        $merchant = $this->merchant();

        // Ends in 2 days: inside both the H-7 (≤7) and H-3 (≤3) windows, so a
        // fresh subscription raises both reminders at once — each once, keyed.
        ServiceSubscription::factory()->create([
            'merchant_id' => $merchant->id,
            'service_id' => Service::factory(),
            'starts_at' => now()->subDays(28),
            'ends_at' => now()->addDays(2),
        ]);

        $this->artisan('subscriptions:notify-expiring')->assertSuccessful();

        $this->assertSame(2, Notification::where('user_id', $internal->id)
            ->where('type', 'subscription_expiring')->count());

        // Re-running the same day must not duplicate — dedupe_key holds.
        $this->artisan('subscriptions:notify-expiring')->assertSuccessful();

        $this->assertSame(2, Notification::where('user_id', $internal->id)
            ->where('type', 'subscription_expiring')->count());
    }

    public function test_expiring_command_ignores_subscriptions_outside_the_window(): void
    {
        $this->internal();
        $merchant = $this->merchant();

        // Ends in 20 days: past H-7.
        ServiceSubscription::factory()->create([
            'merchant_id' => $merchant->id,
            'service_id' => Service::factory(),
            'ends_at' => now()->addDays(20),
        ]);

        $this->artisan('subscriptions:notify-expiring')->assertSuccessful();

        $this->assertSame(0, Notification::where('type', 'subscription_expiring')->count());
    }

    // ── API ──────────────────────────────────────────────────────────────────

    public function test_index_is_scoped_to_the_caller(): void
    {
        $me = $this->internal();
        $other = $this->internal();

        Notification::create(['user_id' => $me->id, 'type' => 'transaction_sale', 'title' => 'Mine', 'message' => 'x']);
        Notification::create(['user_id' => $other->id, 'type' => 'transaction_sale', 'title' => 'Theirs', 'message' => 'y']);

        Sanctum::actingAs($me);

        $this->getJson('/api/v1/payment-internal/notifications')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.data.0.title', 'Mine');
    }

    public function test_unread_count_and_filter(): void
    {
        $me = $this->internal();
        Notification::create(['user_id' => $me->id, 'type' => 't', 'title' => 'a', 'message' => 'x']);
        Notification::create(['user_id' => $me->id, 'type' => 't', 'title' => 'b', 'message' => 'y', 'read_at' => now()]);

        Sanctum::actingAs($me);

        $this->getJson('/api/v1/payment-internal/notifications/unread-count')
            ->assertOk()
            ->assertJsonPath('data.unread_count', 1);

        $this->getJson('/api/v1/payment-internal/notifications?filter=unread')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.data.0.title', 'a');
    }

    public function test_mark_read_and_read_all(): void
    {
        $me = $this->internal();
        $one = Notification::create(['user_id' => $me->id, 'type' => 't', 'title' => 'a', 'message' => 'x']);
        Notification::create(['user_id' => $me->id, 'type' => 't', 'title' => 'b', 'message' => 'y']);

        Sanctum::actingAs($me);

        $this->postJson("/api/v1/payment-internal/notifications/{$one->id}/read")
            ->assertOk()
            ->assertJsonPath('data.is_read', true);

        $this->postJson('/api/v1/payment-internal/notifications/read-all')->assertOk();

        $this->assertSame(0, Notification::where('user_id', $me->id)->whereNull('read_at')->count());
    }

    public function test_marking_another_users_notification_is_not_found(): void
    {
        $me = $this->internal();
        $other = $this->internal();
        $theirs = Notification::create(['user_id' => $other->id, 'type' => 't', 'title' => 'a', 'message' => 'x']);

        Sanctum::actingAs($me);

        $this->postJson("/api/v1/payment-internal/notifications/{$theirs->id}/read")->assertNotFound();
        $this->assertNull($theirs->fresh()->read_at);
    }

    public function test_a_payment_admin_cannot_reach_the_internal_feed(): void
    {
        Sanctum::actingAs($this->merchant());

        $this->getJson('/api/v1/payment-internal/notifications')->assertForbidden();
    }
}
