<?php

declare(strict_types=1);

namespace Tests\Feature\PaymentPage;

use App\Models\PlatformMutation;
use App\Models\Role;
use App\Models\User;
use App\Models\Withdrawal;
use App\Services\Payment\MonetapayService;
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
        Http::fake(['*' => Http::response(['code' => 0, 'data' => ['order_no' => 'MP-OUT-1']])]);
    }

    private function merchant(int $balance = 0): User
    {
        $role = Role::firstOrCreate(['name' => 'Payment-Admin']);

        return User::factory()->create(['role_id' => $role->id, 'balance' => $balance]);
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
        // fee = 1500 + round(100000 * 0.11) = 12500, booked exactly once.
        $this->assertSame(1, PlatformMutation::where('type', 'withdrawal_fee')
            ->where('reference', $withdrawal->withdrawal_number)->count());
        $this->assertDatabaseHas('platform_mutations', [
            'type' => 'withdrawal_fee',
            'reference' => $withdrawal->withdrawal_number,
            'amount' => 12500,
        ]);
        // Settled means paid out — the hold is not refunded.
        $this->assertSame(0, (int) $withdrawal->merchant->fresh()->balance);
    }

    public function test_failed_callback_marks_failed_and_refunds_the_hold(): void
    {
        $withdrawal = $this->processingWithdrawal(100000);
        $this->assertSame(0, (int) $withdrawal->merchant->fresh()->balance);

        $this->sendCallback($this->signedPayload($withdrawal->withdrawal_number, '2'))->assertOk();

        $this->assertSame('FAILED', $withdrawal->fresh()->status->value);
        // The full held amount is returned to the merchant.
        $this->assertSame(100000, (int) $withdrawal->merchant->fresh()->balance);
        $this->assertDatabaseHas('balance_mutations', [
            'reference' => $withdrawal->withdrawal_number,
            'type' => 'refund',
            'amount' => 100000,
        ]);
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
}
