<?php

declare(strict_types=1);

namespace Tests\Feature\PaymentPage;

use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Withdrawal;
use App\Support\Ledger\PlatformLedger;
use App\Support\Wallet\PlatformBalance;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * "Penarikan internal" — kita requests and verifies its own payout, against
 * PlatformBalance rather than a merchant's sales. Same table/status machine
 * as a merchant withdrawal (WithdrawalTest); this file only covers what's
 * different: no merchant on the row, the platform-balance gate, and that the
 * old merchant-only "Verifikasi Penarikan" list stays unaffected.
 */
class InternalWithdrawalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.withdrawal.fee_flat' => 1500,
            'services.withdrawal.fee_percent' => 11,
            'services.withdrawal.min_amount' => 10000,
        ]);
    }

    private function finance(): User
    {
        $role = Role::firstOrCreate(['name' => 'Payment-Internal']);

        return User::factory()->create(['role_id' => $role->id]);
    }

    private function merchant(): User
    {
        $role = Role::firstOrCreate(['name' => 'Payment-Admin']);

        return User::factory()->create(['role_id' => $role->id]);
    }

    /** Seeds realised platform income directly on the ledger, as SettleMerchantTransactionAction/WithdrawalFeeLedger/ServiceRevenueLedger would. */
    private function seedPlatformIncome(int $amount, string $type = 'markup'): void
    {
        PlatformLedger::record(amount: $amount, type: $type, reference: 'SEED-'.Str::random(8));
    }

    private function payload(int $amount = 40000): array
    {
        return [
            'amount' => $amount,
            'bank_code' => 'BCA',
            'account_number' => '1234567890',
            'account_name' => 'Kas Internal',
        ];
    }

    public function test_internal_request_reduces_available_platform_balance(): void
    {
        $this->seedPlatformIncome(100000);
        Sanctum::actingAs($this->finance());

        $response = $this->postJson('/api/v1/payment-internal/withdrawals', $this->payload(40000));

        // fee = 1500 + round(1500 * 0.11) = 1665; nett = 40000 - 1665 = 38335.
        $response->assertCreated()
            ->assertJsonPath('data.status', 'PENDING')
            ->assertJsonPath('data.fee', 1665)
            ->assertJsonPath('data.nett', 38335);

        $this->assertSame(60000, PlatformBalance::available());
    }

    public function test_internal_request_rejected_when_platform_balance_insufficient(): void
    {
        $this->seedPlatformIncome(10000);
        Sanctum::actingAs($this->finance());

        $this->postJson('/api/v1/payment-internal/withdrawals', $this->payload(40000))
            ->assertStatus(422);

        $this->assertSame(10000, PlatformBalance::available());
        $this->assertDatabaseCount('withdrawals', 0);
    }

    public function test_internal_withdrawal_has_no_merchant_and_records_requester(): void
    {
        $this->seedPlatformIncome(100000);
        $requester = $this->finance();
        Sanctum::actingAs($requester);

        $this->postJson('/api/v1/payment-internal/withdrawals', $this->payload(40000))->assertCreated();

        $withdrawal = Withdrawal::firstOrFail();
        $this->assertNull($withdrawal->merchant_id);
        $this->assertSame($requester->id, $withdrawal->requested_by);
    }

    /**
     * The regression that matters most: once internal withdrawals exist, the
     * old "Verifikasi Penarikan" list (no `type` param, default `merchant`)
     * must still show only merchant-initiated rows.
     */
    public function test_index_type_filter_separates_merchant_and_internal_rows(): void
    {
        $this->seedPlatformIncome(100000);
        $merchant = $this->merchant();
        Transaction::factory()->create([
            'merchant_id' => $merchant->id,
            'amount_base' => 100000,
            'amount_fee' => 0,
            'amount_total' => 100000,
            'status' => 'PAID',
            // Past the longest holding period so the merchant's withdrawal here
            // clears the settled-balance check.
            'created_at' => now()->subDays(5),
        ]);

        Sanctum::actingAs($merchant);
        $this->postJson('/api/v1/payment-admin/withdrawals', [
            'amount' => 40000,
            'bank_code' => 'BCA',
            'account_number' => '1234567890',
            'account_name' => 'Client Store',
        ])->assertCreated();

        Sanctum::actingAs($this->finance());
        $this->postJson('/api/v1/payment-internal/withdrawals', $this->payload(40000))->assertCreated();

        // Default (no `type`) and explicit `type=merchant`: only the merchant row.
        $default = $this->getJson('/api/v1/payment-internal/withdrawals')->assertOk();
        $this->assertCount(1, $default->json('data.data'));
        $this->assertNotNull($default->json('data.data.0.merchant'));

        $merchantOnly = $this->getJson('/api/v1/payment-internal/withdrawals?type=merchant')->assertOk();
        $this->assertCount(1, $merchantOnly->json('data.data'));

        $internalOnly = $this->getJson('/api/v1/payment-internal/withdrawals?type=internal')->assertOk();
        $this->assertCount(1, $internalOnly->json('data.data'));
        $this->assertNull($internalOnly->json('data.data.0.merchant'));
        $this->assertNotNull($internalOnly->json('data.data.0.requester'));

        $all = $this->getJson('/api/v1/payment-internal/withdrawals?type=all')->assertOk();
        $this->assertCount(2, $all->json('data.data'));
    }

    public function test_finance_can_approve_its_own_internal_withdrawal_manually(): void
    {
        Storage::fake('public');
        $this->seedPlatformIncome(100000);
        Sanctum::actingAs($this->finance());
        $this->postJson('/api/v1/payment-internal/withdrawals', $this->payload(40000))->assertCreated();
        $withdrawal = Withdrawal::firstOrFail();

        $this->post("/api/v1/payment-internal/withdrawals/{$withdrawal->id}/approve", [
            'method' => 'manual',
            'proof' => UploadedFile::fake()->image('bukti.jpg'),
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'SETTLED');

        // Settled, not refunded: the hold stays (amount still counted against
        // available), but the fee is credited straight back as fresh income —
        // it never actually left the platform — so the net drop is only `nett`.
        $this->assertSame(100000 - 38335, PlatformBalance::available());
    }

    public function test_finance_can_reject_an_internal_withdrawal(): void
    {
        $this->seedPlatformIncome(100000);
        Sanctum::actingAs($this->finance());
        $this->postJson('/api/v1/payment-internal/withdrawals', $this->payload(40000))->assertCreated();
        $withdrawal = Withdrawal::firstOrFail();

        $this->postJson("/api/v1/payment-internal/withdrawals/{$withdrawal->id}/reject", ['reason' => 'batal'])
            ->assertOk()
            ->assertJsonPath('data.status', 'REJECTED');

        $this->assertSame(100000, PlatformBalance::available());
    }

    public function test_platform_balance_endpoint_reports_available(): void
    {
        $this->seedPlatformIncome(75000);
        Sanctum::actingAs($this->finance());

        $this->getJson('/api/v1/payment-internal/platform-balance')
            ->assertOk()
            ->assertJsonPath('data.available', 75000);
    }
}
