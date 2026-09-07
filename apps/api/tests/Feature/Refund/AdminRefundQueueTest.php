<?php

namespace Tests\Feature\Refund;

use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Enums\TransactionStatus;
use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\RefundRequest;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminRefundQueueTest extends TestCase
{
    use RefreshDatabase;

    private function admin(string $name = 'Admin'): User
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        $admin = User::factory()->create(['role_id' => $role->id, 'name' => $name]);
        Sanctum::actingAs($admin, ['access-api']);

        return $admin;
    }

    private function guestRefund(array $state = []): RefundRequest
    {
        $channel = PaymentChannel::factory()->create();
        $transaction = Transaction::factory()->create([
            'payment_channel_id' => $channel->id,
            'status' => TransactionStatus::FAILED_PROVIDER->value,
            'contact_email' => 'guest@example.com',
            'guest_contact' => '081234567890',
        ]);
        $payment = Payment::factory()->create([
            'transaction_id' => $transaction->id,
            'payment_channel_id' => $channel->id,
            'gross_amount' => 12000,
            'status' => PaymentStatus::SUCCESS->value,
        ]);

        return RefundRequest::factory()->pending()->create(array_merge([
            'transaction_id' => $transaction->id,
            'payment_id' => $payment->id,
        ], $state));
    }

    public function test_the_queue_requires_an_admin(): void
    {
        $this->getJson('/api/v1/refunds')->assertUnauthorized();
    }

    public function test_the_queue_lists_and_filters(): void
    {
        $this->admin();
        $pending = $this->guestRefund();
        $this->guestRefund(['status' => RefundStatus::COMPLETED, 'refunded_at' => now()]);

        $this->getJson('/api/v1/refunds')->assertOk()->assertJsonCount(2, 'data.data');

        $this->getJson('/api/v1/refunds?status=PENDING')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.refund_number', $pending->refund_number);

        // Searchable by the four handles an admin is ever given.
        $this->getJson('/api/v1/refunds?search='.$pending->transaction->invoice_number)
            ->assertOk()
            ->assertJsonCount(1, 'data.data');
    }

    public function test_status_counts_are_not_shadowed_by_the_id_route(): void
    {
        $this->admin();
        $this->guestRefund();

        $this->getJson('/api/v1/refunds/status-counts')
            ->assertOk()
            ->assertJsonPath('data.PENDING', 1);
    }

    public function test_an_admin_can_fill_payout_details_on_the_customers_behalf(): void
    {
        $this->admin();
        $refund = $this->guestRefund(['status' => RefundStatus::WAITING_DETAILS]);

        $this->postJson("/api/v1/refunds/{$refund->id}/payout-details", [
            'bank_code' => 'BCA',
            'account_number' => '5555555555',
            'account_name' => 'Guest Customer',
        ])->assertOk();

        $refund->refresh();
        $this->assertSame('admin', $refund->payout_submitted_by);
        $this->assertSame(RefundStatus::PENDING, $refund->status);
    }

    public function test_completing_a_refund_closes_everything_out(): void
    {
        Mail::fake();
        Storage::fake('public');

        $admin = $this->admin();
        $refund = $this->guestRefund();

        $this->postJson("/api/v1/refunds/{$refund->id}/complete", [
            'proof' => UploadedFile::fake()->image('bukti.jpg'),
            'note' => 'Transfer BCA 10:15',
        ])->assertOk();

        $refund->refresh();
        $this->assertSame(RefundStatus::COMPLETED, $refund->status);
        $this->assertSame($admin->id, $refund->processed_by);
        $this->assertNotNull($refund->refunded_at);
        $this->assertNotNull($refund->proof_path);

        // Only now does the money read as having left.
        $this->assertSame(PaymentStatus::REFUNDED, $refund->transaction->payment->fresh()->status);
        $this->assertSame(TransactionStatus::REFUNDED, $refund->transaction->fresh()->status);
    }

    public function test_a_second_complete_is_refused(): void
    {
        Mail::fake();
        Storage::fake('public');
        $this->admin();
        $refund = $this->guestRefund();

        $this->postJson("/api/v1/refunds/{$refund->id}/complete")->assertOk();
        $this->postJson("/api/v1/refunds/{$refund->id}/complete")->assertUnprocessable();
    }

    public function test_a_refund_held_by_another_admin_cannot_be_completed(): void
    {
        Mail::fake();

        $first = $this->admin('First Admin');
        $refund = $this->guestRefund();
        $this->postJson("/api/v1/refunds/{$refund->id}/process")->assertOk();

        // A second operator walks up to the same row.
        $second = User::factory()->create(['role_id' => $first->role_id, 'name' => 'Second Admin']);
        Sanctum::actingAs($second, ['access-api']);

        $this->postJson("/api/v1/refunds/{$refund->id}/complete")->assertUnprocessable();
        $this->assertSame(RefundStatus::PROCESSING, $refund->fresh()->status);
    }

    public function test_processing_requires_payout_details(): void
    {
        $this->admin();
        $refund = $this->guestRefund([
            'status' => RefundStatus::WAITING_DETAILS,
            'bank_code' => null,
            'account_number' => null,
            'account_name' => null,
        ]);

        $this->postJson("/api/v1/refunds/{$refund->id}/process")->assertUnprocessable();
    }

    public function test_rejecting_needs_a_reason_and_moves_no_money(): void
    {
        $this->admin();
        $refund = $this->guestRefund();

        $this->postJson("/api/v1/refunds/{$refund->id}/reject")->assertUnprocessable();

        $this->postJson("/api/v1/refunds/{$refund->id}/reject", ['reason' => 'Klaim ganda'])->assertOk();

        $refund->refresh();
        $this->assertSame(RefundStatus::REJECTED, $refund->status);
        $this->assertSame('Klaim ganda', $refund->reject_reason);
        // The sale still stands: payment untouched, claim link dead.
        $this->assertSame(PaymentStatus::SUCCESS, $refund->transaction->payment->fresh()->status);
        $this->assertNull($refund->claim_token_hash);
    }

    public function test_the_admin_refund_endpoint_422s_on_an_unpaid_transaction(): void
    {
        $this->admin();
        $channel = PaymentChannel::factory()->create();
        $transaction = Transaction::factory()->create([
            'payment_channel_id' => $channel->id,
            'status' => TransactionStatus::EXPIRED->value,
        ]);
        Payment::factory()->create([
            'transaction_id' => $transaction->id,
            'payment_channel_id' => $channel->id,
            'status' => PaymentStatus::EXPIRED->value,
        ]);

        // The old behaviour returned 200 "Transaction refunded successfully"
        // for a refund that never happened.
        $this->postJson("/api/v1/transactions/{$transaction->id}/refund", ['reason' => 'test'])
            ->assertUnprocessable();

        $this->assertSame(0, RefundRequest::count());
    }

    public function test_retry_is_refused_once_a_refund_exists(): void
    {
        $this->admin();
        $refund = $this->guestRefund();

        // Paying the customer back AND buying them the item is the failure this
        // guard exists to prevent.
        $this->postJson("/api/v1/transactions/{$refund->transaction_id}/retry")
            ->assertUnprocessable();
    }

    public function test_manual_review_cannot_assert_a_refund_that_never_happened(): void
    {
        $this->admin();
        $transaction = Transaction::factory()->create(['status' => TransactionStatus::PROCESSING->value]);

        $this->postJson("/api/v1/transactions/{$transaction->id}/manual-review", [
            'status' => 'REFUNDED',
        ])->assertUnprocessable();

        $this->assertSame(TransactionStatus::PROCESSING, $transaction->fresh()->status);
    }
}
