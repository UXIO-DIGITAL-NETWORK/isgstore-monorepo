<?php

namespace Tests\Feature\PaymentPage;

use App\Actions\Settlement\SettleMerchantTransactionAction;
use App\Models\Payment;
use App\Models\PlatformAccount;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MerchantSettlementTest extends TestCase
{
    use RefreshDatabase;

    private function merchant(int $balance = 0): User
    {
        $role = Role::factory()->create(['name' => 'Finance-Developer']);

        return User::factory()->create(['role_id' => $role->id, 'balance' => $balance]);
    }

    private function paidTransaction(User $merchant, int $base, int $fee, int $gatewayFee): Transaction
    {
        $transaction = Transaction::factory()->create([
            'merchant_id' => $merchant->id,
            'amount_base' => $base,
            'amount_fee' => $fee,
            'amount_total' => $base + $fee,
            'status' => 'PAID',
        ]);

        Payment::factory()->create([
            'transaction_id' => $transaction->id,
            'gross_amount' => $base + $fee,
            'admin_fee' => $fee,
            'gateway_fee' => $gatewayFee,
            'status' => '3',
        ]);

        return $transaction->fresh();
    }

    public function test_settlement_credits_merchant_net_and_records_platform_markup(): void
    {
        $merchant = $this->merchant();
        $transaction = $this->paidTransaction($merchant, base: 60000, fee: 3000, gatewayFee: 1000);

        app(SettleMerchantTransactionAction::class)->execute($transaction);

        // Merchant is credited their net product price.
        $this->assertSame(60000, (int) $merchant->fresh()->balance);
        $this->assertDatabaseHas('balance_mutations', [
            'user_id' => $merchant->id,
            'type' => 'settlement',
            'amount' => 60000,
            'reference' => $transaction->invoice_number,
        ]);

        // Platform keeps markup net of the real gateway fee: 3000 - 1000 = 2000.
        $this->assertSame(2000, (int) PlatformAccount::where('code', 'default')->value('balance'));
        $this->assertDatabaseHas('platform_mutations', [
            'type' => 'markup',
            'amount' => 2000,
            'reference' => $transaction->invoice_number,
        ]);
    }

    public function test_settlement_is_idempotent_on_repeat(): void
    {
        $merchant = $this->merchant();
        $transaction = $this->paidTransaction($merchant, base: 60000, fee: 3000, gatewayFee: 1000);

        $action = app(SettleMerchantTransactionAction::class);
        $action->execute($transaction);
        $action->execute($transaction); // e.g. a retried Monetapay webhook

        $this->assertSame(60000, (int) $merchant->fresh()->balance);
        $this->assertSame(2000, (int) PlatformAccount::where('code', 'default')->value('balance'));
        $this->assertSame(1, Transaction::whereKey($transaction->id)->count());
        $this->assertDatabaseCount('balance_mutations', 1);
        $this->assertDatabaseCount('platform_mutations', 1);
    }

    public function test_platform_owned_transaction_does_not_settle(): void
    {
        $transaction = Transaction::factory()->create([
            'merchant_id' => null,
            'amount_base' => 60000,
            'amount_fee' => 3000,
            'status' => 'PAID',
        ]);

        app(SettleMerchantTransactionAction::class)->execute($transaction);

        $this->assertDatabaseCount('balance_mutations', 0);
        $this->assertSame(0, (int) PlatformAccount::where('code', 'default')->value('balance'));
    }
}
