<?php

namespace Tests\Feature\PaymentPage;

use App\Models\PlatformMutation;
use App\Models\Role;
use App\Models\User;
use App\Models\Withdrawal;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WithdrawalTest extends TestCase
{
    use RefreshDatabase;

    private function merchant(int $balance = 0): User
    {
        $role = Role::firstOrCreate(['name' => 'Payment-Admin']);

        return User::factory()->create(['role_id' => $role->id, 'balance' => $balance]);
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

    public function test_merchant_request_holds_funds(): void
    {
        $merchant = $this->merchant(100000);
        Sanctum::actingAs($merchant);

        $response = $this->postJson('/api/v1/payment-admin/withdrawals', $this->payload(40000));

        $response->assertCreated()
            ->assertJsonPath('data.status', 'PENDING')
            ->assertJsonPath('data.nett', 40000);

        // The hold is debited immediately.
        $this->assertSame(60000, (int) $merchant->fresh()->balance);
        $this->assertDatabaseHas('balance_mutations', [
            'user_id' => $merchant->id,
            'type' => 'withdrawal',
            'amount' => -40000,
        ]);
    }

    public function test_request_rejected_when_balance_insufficient(): void
    {
        $merchant = $this->merchant(10000);
        Sanctum::actingAs($merchant);

        $this->postJson('/api/v1/payment-admin/withdrawals', $this->payload(40000))
            ->assertStatus(422);

        $this->assertSame(10000, (int) $merchant->fresh()->balance);
        $this->assertDatabaseCount('withdrawals', 0);
    }

    public function test_finance_approve_manual_settles_without_refunding(): void
    {
        Storage::fake('public');
        $merchant = $this->merchant(100000);
        Sanctum::actingAs($merchant);
        $this->postJson('/api/v1/payment-admin/withdrawals', $this->payload(40000))->assertCreated();
        $withdrawal = Withdrawal::first();

        Sanctum::actingAs($this->finance());
        $this->post("/api/v1/payment-internal/withdrawals/{$withdrawal->id}/approve", [
            'method' => 'manual',
            'proof' => UploadedFile::fake()->image('bukti.jpg'),
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'SETTLED');

        // Balance stays held (paid out), not refunded.
        $this->assertSame(60000, (int) $merchant->fresh()->balance);
    }

    public function test_manual_approve_requires_bukti_transfer(): void
    {
        $merchant = $this->merchant(100000);
        Sanctum::actingAs($merchant);
        $this->postJson('/api/v1/payment-admin/withdrawals', $this->payload(40000))->assertCreated();
        $withdrawal = Withdrawal::first();

        Sanctum::actingAs($this->finance());
        $this->postJson("/api/v1/payment-internal/withdrawals/{$withdrawal->id}/approve", ['method' => 'manual'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('proof');

        // The withdrawal is untouched — no proof means no settlement.
        $this->assertSame('PENDING', $withdrawal->fresh()->status->value);
    }

    public function test_manual_approve_stores_proof_and_credits_fee_once(): void
    {
        Storage::fake('public');
        // A non-zero withdraw fee so the platform credit is observable.
        config(['services.withdrawal.fee_flat' => 5000]);

        $merchant = $this->merchant(100000);
        Sanctum::actingAs($merchant);
        $this->postJson('/api/v1/payment-admin/withdrawals', $this->payload(40000))->assertCreated();
        $withdrawal = Withdrawal::first();
        $this->assertSame(5000, (int) $withdrawal->fee);

        Sanctum::actingAs($this->finance());
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

    public function test_finance_reject_refunds_the_hold(): void
    {
        $merchant = $this->merchant(100000);
        Sanctum::actingAs($merchant);
        $this->postJson('/api/v1/payment-admin/withdrawals', $this->payload(40000))->assertCreated();
        $withdrawal = Withdrawal::first();

        Sanctum::actingAs($this->finance());
        $this->postJson("/api/v1/payment-internal/withdrawals/{$withdrawal->id}/reject", ['reason' => 'invalid account'])
            ->assertOk()
            ->assertJsonPath('data.status', 'REJECTED');

        // The held amount is returned.
        $this->assertSame(100000, (int) $merchant->fresh()->balance);
    }

    public function test_merchant_cannot_see_another_merchants_withdrawal(): void
    {
        $a = $this->merchant(100000);
        Sanctum::actingAs($a);
        $this->postJson('/api/v1/payment-admin/withdrawals', $this->payload(40000))->assertCreated();
        $number = Withdrawal::first()->withdrawal_number;

        Sanctum::actingAs($this->merchant(100000));
        $this->getJson("/api/v1/payment-admin/withdrawals/{$number}")->assertNotFound();
    }

    public function test_role_gates(): void
    {
        // A merchant cannot reach the finance surface.
        Sanctum::actingAs($this->merchant());
        $this->getJson('/api/v1/payment-internal/dashboard')->assertStatus(403);

        // Finance cannot reach the merchant surface.
        Sanctum::actingAs($this->finance());
        $this->getJson('/api/v1/payment-admin/dashboard')->assertStatus(403);
    }
}
