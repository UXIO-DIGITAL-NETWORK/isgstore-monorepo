<?php

declare(strict_types=1);

namespace Tests\Feature\PaymentPage;

use App\Models\PlatformMutation;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Withdrawal;
use App\Services\Payment\MonetapayService;
use App\Support\Wallet\MerchantBalance;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The Monetapay payout callback (7.4.2) — the real step 4.
 *
 * A disbursement create only *accepts* the payout, so the withdrawal stays
 * PROCESSING; this async callback is what settles it. The guarantees pinned
 * here cost real money when they break: a failed payout that never refunds, a
 * fee booked before the money moved, or a replayed callback double-refunding.
 */
class DisbursementCallbackTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Known token so the double-MD5 signature is reproducible, a pinned fee
        // schedule, and a gateway that accepts the disbursement create.
        config([
            'services.monetapay.token' => 'test-token',
            'services.withdrawal.fee_flat' => 1500,
            'services.withdrawal.fee_percent' => 11,
            'services.withdrawal.min_amount' => 10000,
        ]);
        Http::preventStrayRequests();
        // Only the disbursement CREATE endpoint — not the /query inquiry — so a
        // test can add its own query stub (Http::fake is first-match-wins).
        Http::fake(['*/v1.0.0/disbursement' => Http::response(['code' => 0, 'data' => ['order_no' => 'MP-OUT-1']])]);
    }

    /** A merchant whose withdrawable balance is $sales, seeded as a paid sale. */
    private function merchant(int $sales = 0): User
    {
        $role = Role::firstOrCreate(['name' => 'Payment-Admin']);
        $merchant = User::factory()->create(['role_id' => $role->id]);

        if ($sales > 0) {
            Transaction::factory()->create([
                'merchant_id' => $merchant->id,
                'amount_base' => $sales,
                'amount_fee' => 0,
                'amount_total' => $sales,
                'status' => 'PAID',
            ]);
        }

        return $merchant;
    }

    private function finance(): User
    {
        return User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Payment-Internal'])->id]);
    }

    /** Request a withdrawal and approve it via Monetapay — leaves it PROCESSING. */
    private function processingWithdrawal(int $amount = 100000): Withdrawal
    {
        $merchant = $this->merchant($amount);
        Sanctum::actingAs($merchant);
        $this->postJson('/api/v1/payment-admin/withdrawals', [
            'amount' => $amount,
            'bank_code' => 'BCA',
            'account_number' => '1234567890',
            'account_name' => 'Client Store',
        ])->assertCreated();

        $withdrawal = Withdrawal::firstOrFail();

        Sanctum::actingAs($this->finance());
        $this->postJson("/api/v1/payment-internal/withdrawals/{$withdrawal->id}/approve", ['method' => 'monetapay'])
            ->assertOk();

        return $withdrawal->fresh();
    }

    /**
     * Builds the callback envelope: a `__`-delimited key=value string signed with
     * the double-MD5 the service verifies, then AES-encrypted — same shape as the
     * pay-in callback.
     */
    private function signedPayload(string $mchOrderNo, string $status, ?string $sign = null): array
    {
        $params = [
            'mch_order_no' => $mchOrderNo,
            'order_no' => 'MP-OUT-1',
            'status' => $status,
        ];

        $timestamp = (string) time();

        ksort($params);
        $buffer = '';
        foreach ($params as $key => $value) {
            $buffer .= $key.'='.$value.'__';
        }
        $strMap = substr($buffer, 0, -2);

        $params['sign'] = $sign ?? md5(md5('test-token'.'*|*'.$strMap.'@!@'.$timestamp));
        $params['timestamp'] = $timestamp;

        $flat = collect($params)->map(fn ($v, $k) => "{$k}={$v}")->implode('__');

        return ['data' => ['en_data' => app(MonetapayService::class)->encryptPayload($flat)]];
    }

    private function sendCallback(array $payload)
    {
        return $this->postJson('/api/v1/disbursement/merchant/callback', $payload);
    }

    /** Sign + encrypt an arbitrary callback param set (double-MD5, same as the gateway). */
    private function signedEnvelope(array $params): array
    {
        $timestamp = (string) time();

        ksort($params);
        $buffer = '';
        foreach ($params as $key => $value) {
            $buffer .= $key.'='.$value.'__';
        }
        $strMap = substr($buffer, 0, -2);

        $params['sign'] = md5(md5('test-token'.'*|*'.$strMap.'@!@'.$timestamp));
        $params['timestamp'] = $timestamp;

        $flat = collect($params)->map(fn ($v, $k) => "{$k}={$v}")->implode('__');

        return ['data' => ['en_data' => app(MonetapayService::class)->encryptPayload($flat)]];
    }

    public function test_monetapay_approval_leaves_the_withdrawal_processing(): void
    {
        $withdrawal = $this->processingWithdrawal(100000);

        // Accepted, not settled — the fee is not booked until the callback.
        $this->assertSame('PROCESSING', $withdrawal->status->value);
        $this->assertSame('MP-OUT-1', $withdrawal->disbursement_ref);
        $this->assertDatabaseMissing('platform_mutations', [
            'type' => 'withdrawal_fee',
            'reference' => $withdrawal->withdrawal_number,
        ]);
    }

    public function test_successful_callback_settles_and_books_the_fee_once(): void
    {
        $withdrawal = $this->processingWithdrawal(100000);

        $this->sendCallback($this->signedPayload($withdrawal->withdrawal_number, '1'))->assertOk();

        $this->assertSame('SETTLED', $withdrawal->fresh()->status->value);
        // fee = 1500 + round(1500 * 0.11) = 1665 (flat), booked exactly once.
        $this->assertSame(1, PlatformMutation::where('type', 'withdrawal_fee')
            ->where('reference', $withdrawal->withdrawal_number)->count());
        $this->assertDatabaseHas('platform_mutations', [
            'type' => 'withdrawal_fee',
            'reference' => $withdrawal->withdrawal_number,
            'amount' => 1665,
        ]);
        // Settled means paid out — the hold is not restored: available stays 0.
        $this->assertSame(0, MerchantBalance::available((int) $withdrawal->merchant_id));
    }

    public function test_failed_callback_marks_failed_and_restores_available(): void
    {
        $withdrawal = $this->processingWithdrawal(100000);
        // Approved/processing — the request holds the full amount, so available is 0.
        $this->assertSame(0, MerchantBalance::available((int) $withdrawal->merchant_id));

        $this->sendCallback($this->signedPayload($withdrawal->withdrawal_number, '2'))->assertOk();

        $this->assertSame('FAILED', $withdrawal->fresh()->status->value);
        // A FAILED withdrawal drops out of the hold, so available recovers in full
        // with no ledger reversal.
        $this->assertSame(100000, MerchantBalance::available((int) $withdrawal->merchant_id));
        // No fee is booked for a payout that never delivered.
        $this->assertDatabaseMissing('platform_mutations', [
            'type' => 'withdrawal_fee',
            'reference' => $withdrawal->withdrawal_number,
        ]);
    }

    public function test_a_replayed_callback_is_idempotent(): void
    {
        $withdrawal = $this->processingWithdrawal(100000);
        $payload = $this->signedPayload($withdrawal->withdrawal_number, '1');

        $this->sendCallback($payload)->assertOk();
        $this->sendCallback($payload)->assertOk();

        // The fee is still booked exactly once across the retry.
        $this->assertSame(1, PlatformMutation::where('type', 'withdrawal_fee')
            ->where('reference', $withdrawal->withdrawal_number)->count());
        $this->assertSame('SETTLED', $withdrawal->fresh()->status->value);
    }

    public function test_a_bad_signature_is_refused(): void
    {
        $withdrawal = $this->processingWithdrawal(100000);

        $this->sendCallback($this->signedPayload($withdrawal->withdrawal_number, '1', sign: str_repeat('0', 32)))
            ->assertStatus(400);

        // A forged callback changes nothing.
        $this->assertSame('PROCESSING', $withdrawal->fresh()->status->value);
        $this->assertDatabaseMissing('platform_mutations', [
            'type' => 'withdrawal_fee',
            'reference' => $withdrawal->withdrawal_number,
        ]);
    }

    /**
     * Monetapay delivers the payout callback to the shared pay-in URL. The pay-in
     * handler must recognise it (WD- prefix) and settle it, not 500 on a missing Payment.
     */
    public function test_payout_callback_delivered_to_the_payin_url_settles(): void
    {
        $withdrawal = $this->processingWithdrawal(100000);

        $this->postJson('/api/v1/payment/callback', $this->signedEnvelope([
            'mch_order_no' => $withdrawal->withdrawal_number,
            'order_no' => 'MP-OUT-1',
            'amount' => '98335',
            'status' => '1',
        ]))->assertOk();

        $this->assertSame('SETTLED', $withdrawal->fresh()->status->value);
        $this->assertDatabaseHas('platform_mutations', [
            'type' => 'withdrawal_fee',
            'reference' => $withdrawal->withdrawal_number,
            'amount' => 1665,
        ]);
    }

    public function test_failed_payout_callback_on_payin_url_refunds_and_stores_reason(): void
    {
        $withdrawal = $this->processingWithdrawal(100000);

        $this->postJson('/api/v1/payment/callback', $this->signedEnvelope([
            'mch_order_no' => $withdrawal->withdrawal_number,
            'order_no' => '20260814774744200471855104_BATCH',
            'amount' => '98335',
            'status' => '2',
            'error_code' => '7114',
            'error_msg' => 'Insufficient balance',
        ]))->assertOk();

        $fresh = $withdrawal->fresh();
        $this->assertSame('FAILED', $fresh->status->value);
        $this->assertSame('Insufficient balance', $fresh->failure_reason);
        // Available restored to the merchant (FAILED excluded from the hold).
        $this->assertSame(100000, MerchantBalance::available((int) $withdrawal->merchant_id));
    }

    /**
     * A foreign/legacy disbursement (no matching withdrawal, non-WD order) sharing
     * our callback URL must be acked (200), not 500'd into an infinite retry loop.
     */
    public function test_unknown_payout_callback_is_acked_not_500(): void
    {
        $this->postJson('/api/v1/payment/callback', $this->signedEnvelope([
            'mch_order_no' => '2026-08-14dYCeQNAyNZzQ',
            'order_no' => '20260814774744200471855104_BATCH',
            'account_number' => '6700519102',
            'amount' => '24904',
            'status' => '2',
            'error_msg' => 'Insufficient balance',
        ]))->assertOk();
    }

    /** Recovery: a PROCESSING payout whose callback was lost is resolved by the inquiry poll. */
    public function test_sync_processing_command_settles_a_stuck_payout(): void
    {
        $withdrawal = $this->processingWithdrawal(100000);
        // Clear the 2-minute grace window (query builder — don't touch timestamps).
        Withdrawal::whereKey($withdrawal->id)->update(['updated_at' => now()->subMinutes(5)]);

        // Payout inquiry (7.4.1) reports the payout succeeded. Matches the /query
        // URL, which setUp's create stub deliberately doesn't.
        Http::fake(['*/v1.0.0/disbursement/query' => Http::response(['code' => 0, 'data' => ['order_no' => 'MP-OUT-1', 'status' => 1]])]);

        $this->artisan('withdrawals:sync-processing')->assertSuccessful();

        $this->assertSame('SETTLED', $withdrawal->fresh()->status->value);
        $this->assertDatabaseHas('platform_mutations', [
            'type' => 'withdrawal_fee',
            'reference' => $withdrawal->withdrawal_number,
        ]);
    }
}
