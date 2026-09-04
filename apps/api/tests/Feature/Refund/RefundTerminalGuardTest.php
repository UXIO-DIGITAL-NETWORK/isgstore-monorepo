<?php

namespace Tests\Feature\Refund;

use App\Actions\Refund\InitiateRefundAction;
use App\Actions\Uxiolabs\HandleUxiolabsWebhookAction;
use App\Enums\PaymentStatus;
use App\Enums\TransactionStatus;
use App\Models\BalanceMutation;
use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * REFUNDED is a terminal transaction status, and every guard that lists the
 * terminal states has to know it.
 *
 * uxiolabs can redeliver `cancel` and then `success`. Before REFUNDED was ever
 * written this was harmless; now a guard that has not been widened would let
 * that late success flip an already-refunded order back to COMPLETED — after
 * the member's wallet was credited or a guest was wired their money. We would
 * have paid for the order twice and the books would say it succeeded.
 */
class RefundTerminalGuardTest extends TestCase
{
    use RefreshDatabase;

    private function refundedMemberOrder(): Transaction
    {
        $role = Role::factory()->create(['name' => 'Member']);
        $member = User::factory()->create(['role_id' => $role->id, 'balance' => 0]);
        $channel = PaymentChannel::factory()->create();

        $transaction = Transaction::factory()->create([
            'user_id' => $member->id,
            'payment_channel_id' => $channel->id,
            'status' => TransactionStatus::FAILED_PROVIDER->value,
            'supplier_trx_id' => 'UXORDER-1',
        ]);

        Payment::factory()->create([
            'transaction_id' => $transaction->id,
            'payment_channel_id' => $channel->id,
            'gross_amount' => 12000,
            'status' => PaymentStatus::SUCCESS->value,
        ]);

        app(InitiateRefundAction::class)->execute($transaction->fresh());

        return $transaction->fresh();
    }

    public function test_a_late_success_callback_cannot_resurrect_a_refunded_order(): void
    {
        $transaction = $this->refundedMemberOrder();
        $this->assertSame(TransactionStatus::REFUNDED, $transaction->status);

        app(HandleUxiolabsWebhookAction::class)->execute([
            'idtrx' => $transaction->invoice_number,
            'id' => 'UXORDER-1',
            'keterangan' => 'SN-LATE-999',
            'status' => 'success',
        ]);

        $fresh = $transaction->fresh();
        $this->assertSame(TransactionStatus::REFUNDED, $fresh->status);
        // No serial number either — the order was not fulfilled, it was refunded.
        $this->assertNull($fresh->sn);
    }

    public function test_a_redelivered_cancel_callback_does_not_credit_twice(): void
    {
        $transaction = $this->refundedMemberOrder();
        $member = $transaction->user;

        $this->assertSame(12000, (int) $member->fresh()->balance);

        app(HandleUxiolabsWebhookAction::class)->execute([
            'idtrx' => $transaction->invoice_number,
            'id' => 'UXORDER-1',
            'keterangan' => '',
            'status' => 'cancel',
        ]);

        $this->assertSame(12000, (int) $member->fresh()->balance);
        $this->assertSame(1, BalanceMutation::where('user_id', $member->id)->where('type', 'refund')->count());
    }

    public function test_the_status_counts_expose_refunded_instead_of_losing_the_row(): void
    {
        $adminRole = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $adminRole->id]), ['access-api']);

        $this->refundedMemberOrder();

        $this->getJson('/api/v1/transactions/status-counts')
            ->assertOk()
            ->assertJsonPath('data.refunded', 1)
            ->assertJsonPath('data.failed_provider', 0);
    }
}
