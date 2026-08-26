<?php

declare(strict_types=1);

namespace Tests\Feature\PaymentPage;

use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use App\Support\Wallet\MerchantBalance;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The withdrawal holding period: a paid sale becomes withdrawable only after
 * its channel's Monetapay settlement window (T+n, MonetapayContractFees) plus
 * the fraud buffer (`services.withdrawal.hold_buffer_days`). Until then it is
 * "Saldo Tertahan" — earned, visible, but not payable out. This is the
 * platform's only protection against a partner selling at 10:00 and draining
 * the payout at 10:05 on a fraudulent sale.
 */
class WithdrawalHoldingPeriodTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.withdrawal.fee_flat' => 1500,
            'services.withdrawal.fee_percent' => 11,
            'services.withdrawal.min_amount' => 10000,
            'services.withdrawal.hold_buffer_days' => 1,
        ]);
    }

    private function merchant(): User
    {
        $role = Role::firstOrCreate(['name' => 'Payment-Admin']);

        return User::factory()->create(['role_id' => $role->id]);
    }

    /** A paid sale on the given channel, with its payment stamped paid at $paidAt. */
    private function sale(User $merchant, string $channelCode, int $amount, \DateTimeInterface $paidAt): Transaction
    {
        $channel = PaymentChannel::firstOrCreate(
            ['channel_code' => $channelCode],
            PaymentChannel::factory()->make(['channel_code' => $channelCode])->getAttributes(),
        );

        $transaction = Transaction::factory()->create([
            'merchant_id' => $merchant->id,
            'payment_channel_id' => $channel->id,
            'amount_base' => $amount,
            'amount_fee' => 0,
            'amount_total' => $amount,
            'status' => 'PAID',
            'created_at' => $paidAt,
        ]);

        Payment::factory()->create([
            'transaction_id' => $transaction->id,
            'payment_channel_id' => $channel->id,
            'gross_amount' => $amount,
            'status' => '3',
            'paid_at' => $paidAt,
        ]);

        return $transaction;
    }

    public function test_a_fresh_qris_sale_is_held_not_available(): void
    {
        $merchant = $this->merchant();
        // QRIS settles T+1; with the 1-day buffer the hold is 2 days.
        $this->sale($merchant, 'qris', 100000, now());

        $this->assertSame(0, MerchantBalance::available($merchant->id));
        $this->assertSame(100000, MerchantBalance::heldSalesTotal($merchant->id));
        $this->assertSame(100000, MerchantBalance::salesTotal($merchant->id));
    }

    public function test_a_held_sale_cannot_be_withdrawn(): void
    {
        $merchant = $this->merchant();
        $this->sale($merchant, 'qris', 100000, now());

        Sanctum::actingAs($merchant);
        $this->postJson('/api/v1/payment-admin/withdrawals', [
            'amount' => 40000,
            'bank_code' => 'BCA',
            'account_number' => '1234567890',
            'account_name' => 'Client Store',
        ])->assertStatus(422);

        $this->assertDatabaseCount('withdrawals', 0);
    }

    public function test_the_qris_hold_releases_after_settlement_plus_buffer(): void
    {
        $merchant = $this->merchant();
        $this->sale($merchant, 'qris', 100000, now());

        // T+1 settlement + 1-day buffer: still held after 1 day...
        $this->travel(1)->days();
        $this->assertSame(0, MerchantBalance::available($merchant->id));

        // ...released after 2.
        $this->travel(1)->days();
        $this->assertSame(100000, MerchantBalance::available($merchant->id));
        $this->assertSame(0, MerchantBalance::heldSalesTotal($merchant->id));
    }

    public function test_a_va_sale_holds_only_the_buffer(): void
    {
        $merchant = $this->merchant();
        // VA settles T+0 — the 1-day buffer is the whole hold.
        $this->sale($merchant, 'bri_va', 50000, now());

        $this->assertSame(0, MerchantBalance::available($merchant->id));

        $this->travel(1)->days();
        $this->assertSame(50000, MerchantBalance::available($merchant->id));
    }

    public function test_retail_holds_the_longest(): void
    {
        $merchant = $this->merchant();
        // Indomaret settles T+3 → hold is 4 days.
        $this->sale($merchant, 'indomaret', 75000, now());

        $this->travel(3)->days();
        $this->assertSame(0, MerchantBalance::available($merchant->id));

        $this->travel(1)->days();
        $this->assertSame(75000, MerchantBalance::available($merchant->id));
    }

    public function test_an_unknown_channel_settles_at_t0_buffer_still_applies(): void
    {
        $merchant = $this->merchant();
        // Not in the Monetapay contract table → T+0, but never same-day.
        $this->sale($merchant, 'ch_custom99', 60000, now());

        $this->assertSame(0, MerchantBalance::available($merchant->id));

        $this->travel(1)->days();
        $this->assertSame(60000, MerchantBalance::available($merchant->id));
    }

    public function test_mixed_channels_release_independently(): void
    {
        $merchant = $this->merchant();
        $this->sale($merchant, 'bri_va', 50000, now());   // hold 1 day
        $this->sale($merchant, 'shopeepay', 30000, now()); // T+2 → hold 3 days

        $this->travel(1)->days();
        $this->assertSame(50000, MerchantBalance::available($merchant->id));
        $this->assertSame(30000, MerchantBalance::heldSalesTotal($merchant->id));

        $this->travel(2)->days();
        $this->assertSame(80000, MerchantBalance::available($merchant->id));
    }

    public function test_dashboard_exposes_saldo_tertahan(): void
    {
        $merchant = $this->merchant();
        $this->sale($merchant, 'qris', 100000, now());
        $this->sale($merchant, 'bri_va', 40000, now()->subDays(5)); // long settled

        Sanctum::actingAs($merchant);
        $this->getJson('/api/v1/payment-admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.saldo_aktif', 40000)
            ->assertJsonPath('data.saldo_tertahan', 100000)
            ->assertJsonPath('data.total_penjualan', 140000);
    }
}
