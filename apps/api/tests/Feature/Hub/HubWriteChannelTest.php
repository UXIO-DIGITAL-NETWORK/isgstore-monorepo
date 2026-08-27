<?php

declare(strict_types=1);

namespace Tests\Feature\Hub;

use App\Enums\WithdrawalStatus;
use App\Jobs\ProcessWithdrawalPayoutJob;
use App\Models\Role;
use App\Models\User;
use App\Models\Withdrawal;
use App\Support\Hub\HubSystemUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

/**
 * The Hub money-path write channel: approve/reject withdrawals driven from the
 * Hub. Auth is two keys — the read X-Hub-Key AND the separate X-Hub-Write-Key,
 * plus HUB_WRITE_ENABLED. Each endpoint wraps the same action the on-site panel
 * uses, attributed to the HubSystemUser.
 */
class HubWriteChannelTest extends TestCase
{
    use RefreshDatabase;

    private const READ = 'read-key-xyz';

    private const WRITE = 'write-key-abc';

    private function enable(bool $writeEnabled = true): void
    {
        config([
            'services.hub.enabled' => true,
            'services.hub.api_key' => self::READ,
            'services.hub.write_enabled' => $writeEnabled,
            'services.hub.write_api_key' => self::WRITE,
        ]);
    }

    private function headers(array $over = []): array
    {
        return array_merge(['X-Hub-Key' => self::READ, 'X-Hub-Write-Key' => self::WRITE], $over);
    }

    private function pendingWithdrawal(string $number = 'WD-100'): Withdrawal
    {
        $merchant = User::factory()->create([
            'role_id' => Role::firstOrCreate(['name' => 'Payment-Admin'])->id,
        ]);

        return Withdrawal::create([
            'merchant_id' => $merchant->id,
            'withdrawal_number' => $number,
            'amount' => 40000, 'fee' => 1665, 'nett' => 38335,
            'bank_code' => 'BCA', 'account_number' => '1234567890', 'account_name' => 'Client Store',
            'status' => WithdrawalStatus::PENDING->value,
        ]);
    }

    public function test_writes_are_dead_when_the_write_channel_is_disabled(): void
    {
        $this->enable(writeEnabled: false);
        $w = $this->pendingWithdrawal();

        $this->postJson("/api/v1/hub/withdrawals/{$w->withdrawal_number}/approve", [], $this->headers())
            ->assertStatus(403);
    }

    public function test_a_missing_or_wrong_write_key_is_rejected_even_with_a_valid_read_key(): void
    {
        $this->enable();
        $w = $this->pendingWithdrawal();

        // Read key valid, write key missing.
        $this->postJson("/api/v1/hub/withdrawals/{$w->withdrawal_number}/approve", [], ['X-Hub-Key' => self::READ])
            ->assertStatus(403);

        // Read key valid, write key wrong.
        $this->postJson(
            "/api/v1/hub/withdrawals/{$w->withdrawal_number}/approve",
            [],
            $this->headers(['X-Hub-Write-Key' => 'nope']),
        )->assertStatus(403);

        // Write key valid, read key wrong — the read gate refuses first.
        $this->postJson(
            "/api/v1/hub/withdrawals/{$w->withdrawal_number}/approve",
            [],
            $this->headers(['X-Hub-Key' => 'nope']),
        )->assertStatus(403);
    }

    public function test_approve_runs_the_real_action_as_the_system_user(): void
    {
        Bus::fake([ProcessWithdrawalPayoutJob::class]);
        $this->enable();
        $w = $this->pendingWithdrawal();

        $this->postJson("/api/v1/hub/withdrawals/{$w->withdrawal_number}/approve", [], $this->headers())
            ->assertOk()
            ->assertJsonPath('data.status', WithdrawalStatus::APPROVED->value);

        $w->refresh();
        $this->assertSame(WithdrawalStatus::APPROVED, $w->status);
        $this->assertSame(HubSystemUser::resolve()->id, $w->approved_by);
        Bus::assertDispatched(ProcessWithdrawalPayoutJob::class);
    }

    public function test_reject_runs_the_real_action_with_a_reason(): void
    {
        $this->enable();
        $w = $this->pendingWithdrawal();

        $this->postJson(
            "/api/v1/hub/withdrawals/{$w->withdrawal_number}/reject",
            ['reason' => 'Rekening tidak valid'],
            $this->headers(),
        )->assertOk()->assertJsonPath('data.status', WithdrawalStatus::REJECTED->value);

        $w->refresh();
        $this->assertSame(WithdrawalStatus::REJECTED, $w->status);
        $this->assertSame('Rekening tidak valid', $w->notes);
    }

    public function test_replaying_a_processed_withdrawal_is_a_benign_422(): void
    {
        Bus::fake([ProcessWithdrawalPayoutJob::class]);
        $this->enable();
        $w = $this->pendingWithdrawal();

        $this->postJson("/api/v1/hub/withdrawals/{$w->withdrawal_number}/approve", [], $this->headers())->assertOk();

        // Second approve on an already-approved row: the action's status guard
        // throws, surfaced as 422 so the Hub treats it as "already done".
        $this->postJson("/api/v1/hub/withdrawals/{$w->withdrawal_number}/approve", [], $this->headers())
            ->assertStatus(422);
    }
}
