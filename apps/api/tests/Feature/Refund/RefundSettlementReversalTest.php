<?php

namespace Tests\Feature\Refund;

use App\Actions\Refund\InitiateRefundAction;
use App\Actions\Settlement\SettleMerchantTransactionAction;
use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\PlatformAccount;
use App\Models\PlatformMutation;
use App\Models\RefundRequest;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use App\Support\Wallet\PlatformBalance;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * A refund un-books the sale it reverses. Settlement credited the merchant
 * `amount_base` and the platform its markup at PAID; when the money goes back
 * to the customer, both have to come off — plus the gateway fee and PPN, which
 * are genuinely gone.
 */
class RefundSettlementReversalTest extends TestCase
{
    use RefreshDatabase;

    private function merchant(int $balance = 0): User
    {
        $role = Role::factory()->create(['name' => 'Payment-Admin']);

        return User::factory()->create(['role_id' => $role->id, 'balance' => $balance]);
    }

    private function member(): User
    {
        $role = Role::factory()->create(['name' => 'Member']);

        return User::factory()->create(['role_id' => $role->id, 'balance' => 0]);
    }

    /** A settled sale: base 60.000 + fee 3.000, of which Monetapay kept 1.000 and PPN 200. */
    private function settledSale(User $merchant, ?User $buyer): Transaction
    {
        $channel = PaymentChannel::factory()->create();

        $transaction = Transaction::factory()->create([
            'user_id' => $buyer?->id,
            'merchant_id' => $merchant->id,
            'payment_channel_id' => $channel->id,
            'amount_base' => 60000,
            'amount_fee' => 3000,
            'amount_total' => 63000,
            'status' => 'PAID',
        ]);

        Payment::factory()->create([
            'transaction_id' => $transaction->id,
            'payment_channel_id' => $channel->id,
            'gross_amount' => 63000,
            'admin_fee' => 3000,
            'gateway_fee' => 1000,
            'tax_amount' => 200,
            'status' => '3',
        ]);

        $transaction = $transaction->fresh();
        app(SettleMerchantTransactionAction::class)->execute($transaction);

        return $transaction->fresh();
    }

    public function test_a_member_refund_reverses_the_merchant_and_platform_books(): void
    {
        $merchant = $this->merchant();
        $member = $this->member();
        $transaction = $this->settledSale($merchant, $member);

        // Booked at PAID: merchant 60.000, platform 3000 - 1000 - 200 = 1800.
        $this->assertSame(60000, (int) $merchant->fresh()->balance);
        $this->assertSame(1800, (int) PlatformAccount::where('code', 'default')->value('balance'));

        app(InitiateRefundAction::class)->execute($transaction);

        $this->assertSame(0, (int) $merchant->fresh()->balance);
        $this->assertDatabaseHas('balance_mutations', [
            'user_id' => $merchant->id,
            'type' => 'settlement_reversal',
            'amount' => -60000,
            // Prefixed, so settlement's own idempotency guard cannot mistake a
            // reversal for a settlement on a re-delivered PAID webhook.
            'reference' => 'RFD-'.$transaction->invoice_number,
        ]);

        // Markup un-booked (-1800) AND the unrecoverable cost of the refund
        // booked (-1200 = gateway fee 1000 + PPN 200), because the customer was
        // paid the full gross while Monetapay kept its cut.
        $this->assertSame(-1200, (int) PlatformAccount::where('code', 'default')->value('balance'));
        $this->assertSame(-1200, PlatformBalance::income());
    }

    public function test_the_platform_reversal_is_typed_markup_so_income_actually_sees_it(): void
    {
        $merchant = $this->merchant();
        $transaction = $this->settledSale($merchant, $this->member());

        app(InitiateRefundAction::class)->execute($transaction);

        // PlatformBalance::income() whitelists ['markup','withdrawal_fee',
        // 'service_revenue']. A `markup_reversal` type would be silently
        // ignored and kita's withdrawable balance would stay inflated by every
        // refund — this assertion is the tripwire for that mistake.
        $this->assertSame(0, PlatformMutation::whereIn('type', ['markup_reversal', 'settlement_reversal'])->count());
        $this->assertSame(
            (int) PlatformAccount::where('code', 'default')->value('balance'),
            PlatformBalance::income()
        );
    }

    public function test_the_reversal_runs_once_however_often_the_refund_is_retried(): void
    {
        $merchant = $this->merchant();
        $transaction = $this->settledSale($merchant, $this->member());

        $action = app(InitiateRefundAction::class);
        $action->execute($transaction);
        $action->execute($transaction->fresh());

        $this->assertSame(1, PlatformMutation::where('reference', 'RFD-'.$transaction->invoice_number)
            ->where('description', 'like', 'Pembatalan markup%')->count());
        $this->assertSame(0, (int) $merchant->fresh()->balance);
    }

    public function test_the_refund_still_completes_when_the_merchant_already_spent_the_money(): void
    {
        Mail::fake();

        $merchant = $this->merchant();
        $member = $this->member();
        $transaction = $this->settledSale($merchant, $member);

        // The merchant withdrew or spent its settlement before the supplier
        // failed. WalletLedger refuses to drive a balance negative.
        // Written straight to the row: a forceFill()->save() back to the same
        // in-memory value marks nothing dirty and issues no UPDATE.
        User::whereKey($merchant->id)->update(['balance' => 0]);

        $refund = app(InitiateRefundAction::class)->execute($transaction);

        // The customer is made whole regardless — bookkeeping never holds a
        // refund hostage.
        $this->assertNotNull($refund);
        $this->assertSame(63000, (int) $member->fresh()->balance);
        $this->assertSame(0, (int) $merchant->fresh()->balance);

        // The platform side still reverses, and the shortfall is visible as a
        // missing settlement_reversal mutation for the merchant.
        $this->assertDatabaseMissing('balance_mutations', [
            'user_id' => $merchant->id,
            'type' => 'settlement_reversal',
        ]);
        $this->assertSame(-1200, (int) PlatformAccount::where('code', 'default')->value('balance'));
    }

    public function test_a_rejected_guest_refund_leaves_the_settlement_intact(): void
    {
        $merchant = $this->merchant();
        $transaction = $this->settledSale($merchant, null);

        Mail::fake();
        $refund = app(InitiateRefundAction::class)->execute($transaction);

        // A guest refund books nothing until an admin actually transfers.
        $this->assertSame(60000, (int) $merchant->fresh()->balance);
        $this->assertSame(1800, (int) PlatformAccount::where('code', 'default')->value('balance'));
        $this->assertNull(RefundRequest::find($refund->id)->settlement_reversed_at);
    }
}
