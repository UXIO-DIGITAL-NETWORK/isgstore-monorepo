<?php

namespace Tests\Feature\PaymentPage;

use App\Models\PlatformMutation;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Withdrawal;
use App\Support\Wallet\MerchantBalance;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WithdrawalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Pin the fee schedule so the assertions don't depend on env overrides:
        // fee = 1500 + 11% of the flat 1500 = 1665 (flat, amount-independent),
        // minimum request 10.000.
        config([
            'services.withdrawal.fee_flat' => 1500,
            'services.withdrawal.fee_percent' => 11,
            'services.withdrawal.min_amount' => 10000,
        ]);
    }

    /**
     * A payment-page merchant whose withdrawable balance is $sales, seeded as a
     * paid sale (the withdrawable balance is now derived from sales, not the
     * users.balance column).
     */
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
                // Backdated past the longest holding period (T+3 + 1-day
                // buffer) so these tests exercise the settled regime; the
                // holding period itself is pinned in WithdrawalHoldingPeriodTest.
                'created_at' => now()->subDays(5),
            ]);
        }

        return $merchant;
    }

    private function finance(): User
    {
        $role = Role::firstOrCreate(['name' => 'Payment-Internal']);

        return User::factory()->create(['role_id' => $role->id]);
    }

    private function payload(int $amount = 40000): array
    {
        return [
            'amount' => $amount,
            'bank_code' => 'BCA',
            'account_number' => '1234567890',
            'account_name' => 'Client Store',
        ];
    }

    public function test_merchant_request_reduces_available_balance(): void
    {
        $merchant = $this->merchant(100000);
        Sanctum::actingAs($merchant, ['access-api']);

        $response = $this->postJson('/api/v1/payment-admin/withdrawals', $this->payload(40000));

        // fee = 1500 + round(1500 * 0.11) = 1500 + 165 = 1665 (flat); nett = 40000 - 1665 = 38335.
        $response->assertCreated()
            ->assertJsonPath('data.status', 'PENDING')
            ->assertJsonPath('data.fee', 1665)
            ->assertJsonPath('data.nett', 38335);

        // The pending request holds the full requested amount against sales, so
        // the live available balance drops by 40000 (not the nett).
        $this->assertSame(60000, MerchantBalance::available($merchant->id));
        $this->assertDatabaseHas('withdrawals', [
            'merchant_id' => $merchant->id,
            'status' => 'PENDING',
            'amount' => 40000,
        ]);
    }

    public function test_fee_is_a_flat_1665_regardless_of_amount(): void
    {
        // fee = 1500 + round(1500 * 0.11) = 1500 + 165 = 1665, the same for
        // every amount (the 11% is taken on the flat, not the withdrawal amount).
        $big = $this->merchant(500000);
        Sanctum::actingAs($big, ['access-api']);
        $this->postJson('/api/v1/payment-admin/withdrawals', $this->payload(100000))
            ->assertCreated()
            ->assertJsonPath('data.fee', 1665)
            ->assertJsonPath('data.nett', 98335); // 100000 - 1665

        $small = $this->merchant(500000);
        Sanctum::actingAs($small, ['access-api']);
        $this->postJson('/api/v1/payment-admin/withdrawals', $this->payload(20000))
            ->assertCreated()
            ->assertJsonPath('data.fee', 1665) // identical fee on a different amount
            ->assertJsonPath('data.nett', 18335); // 20000 - 1665
    }

    public function test_request_below_minimum_is_rejected(): void
    {
        $merchant = $this->merchant(100000);
        Sanctum::actingAs($merchant, ['access-api']);

        // Below the 10.000 floor — rejected before any hold, so nett can never
        // go non-positive under the 1500 + 11% schedule.
        $this->postJson('/api/v1/payment-admin/withdrawals', $this->payload(5000))
            ->assertStatus(422)
            ->assertJsonValidationErrors('amount');

        $this->assertSame(100000, MerchantBalance::available($merchant->id));
        $this->assertDatabaseCount('withdrawals', 0);
    }

    public function test_request_rejected_when_sales_insufficient(): void
    {
        $merchant = $this->merchant(10000);
        Sanctum::actingAs($merchant, ['access-api']);

        $this->postJson('/api/v1/payment-admin/withdrawals', $this->payload(40000))
            ->assertStatus(422);

        $this->assertSame(10000, MerchantBalance::available($merchant->id));
        $this->assertDatabaseCount('withdrawals', 0);
    }

    public function test_rejects_an_unknown_bank_code(): void
    {
        $merchant = $this->merchant(100000);
        Sanctum::actingAs($merchant, ['access-api']);

        $this->postJson('/api/v1/payment-admin/withdrawals', [
            'amount' => 40000,
            'bank_code' => 'NOT_A_BANK',
            'account_number' => '1234567890',
            'account_name' => 'Client Store',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('bank_code');

        $this->assertDatabaseCount('withdrawals', 0);
    }

    public function test_ewallet_withdrawal_routes_to_the_ewallet_payout_endpoint(): void
    {
        config(['services.monetapay.token' => 'test-token']);
        Http::preventStrayRequests();
        Http::fake(['*' => Http::response(['code' => 0, 'data' => ['order_no' => 'MP-EW-1']])]);

        // E-wallet payout: keyed on the phone, no account number required.
        $merchant = $this->merchant(100000);
        Sanctum::actingAs($merchant, ['access-api']);
        $this->postJson('/api/v1/payment-admin/withdrawals', [
            'amount' => 40000,
            'bank_code' => 'DANA',
            'account_name' => 'Client Store',
            'account_phone' => '08123456789',
        ])->assertCreated();
        $withdrawal = Withdrawal::firstOrFail();

        Sanctum::actingAs($this->finance(), ['access-api']);
        $this->postJson("/api/v1/payment-internal/withdrawals/{$withdrawal->id}/approve", ['method' => 'monetapay'])
            ->assertOk();

        // The job routed to the e-wallet disbursement endpoint, not the bank one.
        Http::assertSent(fn ($request) => str_contains($request->url(), '/ewallet-disbursement'));
        $this->assertSame('PROCESSING', $withdrawal->fresh()->status->value);
    }

    public function test_finance_approve_manual_settles_without_refunding(): void
    {
        Storage::fake('public');
        $merchant = $this->merchant(100000);
        Sanctum::actingAs($merchant, ['access-api']);
        $this->postJson('/api/v1/payment-admin/withdrawals', $this->payload(40000))->assertCreated();
        $withdrawal = Withdrawal::first();

        Sanctum::actingAs($this->finance(), ['access-api']);
        $this->post("/api/v1/payment-internal/withdrawals/{$withdrawal->id}/approve", [
            'method' => 'manual',
            'proof' => UploadedFile::fake()->image('bukti.jpg'),
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'SETTLED');

        // A settled withdrawal stays held (paid out), not refunded: available
        // remains reduced by the withdrawn amount.
        $this->assertSame(60000, MerchantBalance::available($merchant->id));
    }

    public function test_manual_approve_requires_bukti_transfer(): void
    {
        $merchant = $this->merchant(100000);
        Sanctum::actingAs($merchant, ['access-api']);
        $this->postJson('/api/v1/payment-admin/withdrawals', $this->payload(40000))->assertCreated();
        $withdrawal = Withdrawal::first();

        Sanctum::actingAs($this->finance(), ['access-api']);
        $this->postJson("/api/v1/payment-internal/withdrawals/{$withdrawal->id}/approve", ['method' => 'manual'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('proof');

        // The withdrawal is untouched — no proof means no settlement.
        $this->assertSame('PENDING', $withdrawal->fresh()->status->value);
    }

    public function test_manual_approve_stores_proof_and_credits_fee_once(): void
    {
        Storage::fake('public');
        // A clean flat-only fee so the platform credit is exactly observable.
        config(['services.withdrawal.fee_flat' => 5000, 'services.withdrawal.fee_percent' => 0]);

        $merchant = $this->merchant(100000);
        Sanctum::actingAs($merchant, ['access-api']);
        $this->postJson('/api/v1/payment-admin/withdrawals', $this->payload(40000))->assertCreated();
        $withdrawal = Withdrawal::first();
        $this->assertSame(5000, (int) $withdrawal->fee);

        Sanctum::actingAs($this->finance(), ['access-api']);
        $response = $this->post("/api/v1/payment-internal/withdrawals/{$withdrawal->id}/approve", [
            'method' => 'manual',
            'proof' => UploadedFile::fake()->image('bukti.jpg'),
        ])->assertOk();

        // Proof is stored on the public disk and surfaced as an absolute URL.
        $proofPath = $withdrawal->fresh()->proof_path;
        $this->assertNotNull($proofPath);
        Storage::disk('public')->assertExists($proofPath);
        $this->assertNotNull($response->json('data.proof_url'));

        // Kita's withdraw fee is booked exactly once on the platform ledger.
        $this->assertDatabaseHas('platform_mutations', [
            'type' => 'withdrawal_fee',
            'reference' => $withdrawal->withdrawal_number,
            'amount' => 5000,
        ]);
        $this->assertSame(1, Withdrawal::query()->count());
        $this->assertSame(
            1,
            PlatformMutation::where('type', 'withdrawal_fee')
                ->where('reference', $withdrawal->withdrawal_number)
                ->count()
        );
    }

    public function test_finance_reject_restores_available_balance(): void
    {
        $merchant = $this->merchant(100000);
        Sanctum::actingAs($merchant, ['access-api']);
        $this->postJson('/api/v1/payment-admin/withdrawals', $this->payload(40000))->assertCreated();
        $withdrawal = Withdrawal::first();

        Sanctum::actingAs($this->finance(), ['access-api']);
        $this->postJson("/api/v1/payment-internal/withdrawals/{$withdrawal->id}/reject", ['reason' => 'invalid account'])
            ->assertOk()
            ->assertJsonPath('data.status', 'REJECTED');

        // A REJECTED withdrawal drops out of the hold, so available recovers in
        // full with no ledger reversal.
        $this->assertSame(100000, MerchantBalance::available($merchant->id));
    }

    public function test_merchant_cannot_see_another_merchants_withdrawal(): void
    {
        $a = $this->merchant(100000);
        Sanctum::actingAs($a, ['access-api']);
        $this->postJson('/api/v1/payment-admin/withdrawals', $this->payload(40000))->assertCreated();
        $number = Withdrawal::first()->withdrawal_number;

        Sanctum::actingAs($this->merchant(100000), ['access-api']);
        $this->getJson("/api/v1/payment-admin/withdrawals/{$number}")->assertNotFound();
    }

    public function test_role_gates(): void
    {
        // A merchant cannot reach the finance surface.
        Sanctum::actingAs($this->merchant(), ['access-api']);
        $this->getJson('/api/v1/payment-internal/dashboard')->assertStatus(403);

        // Finance cannot reach the merchant surface.
        Sanctum::actingAs($this->finance(), ['access-api']);
        $this->getJson('/api/v1/payment-admin/dashboard')->assertStatus(403);
    }
}
