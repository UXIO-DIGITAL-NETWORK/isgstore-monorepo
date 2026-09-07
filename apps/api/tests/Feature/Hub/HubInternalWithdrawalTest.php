<?php

declare(strict_types=1);

namespace Tests\Feature\Hub;

use App\Enums\WithdrawalStatus;
use App\Models\Notification;
use App\Models\Withdrawal;
use App\Support\Hub\HubSystemUser;
use App\Support\Ledger\PlatformLedger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Raising an internal (platform-profit) withdrawal from the Hub panel.
 *
 * The Hub holds no money; it asks the site to run the same action the on-site
 * payment-internal panel runs. So the balance guard tested here is deliberately
 * the SITE's — proving the Hub cannot talk the site past its own floor.
 */
class HubInternalWithdrawalTest extends TestCase
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

    /** Give the platform some withdrawable income. */
    private function fundPlatform(int $amount = 100000): void
    {
        PlatformLedger::record(type: 'markup', amount: $amount, reference: 'seed-'.uniqid());
    }

    private function payload(array $over = []): array
    {
        return array_merge([
            'amount' => 40000,
            'bank_code' => 'BCA',
            'account_number' => '1234567890',
            'account_name' => 'Uxio Internal',
            'account_phone' => '08123456789',
        ], $over);
    }

    public function test_it_creates_an_internal_withdrawal_attributed_to_the_hub_system_user(): void
    {
        $this->enable();
        $this->fundPlatform();

        $response = $this->postJson('/api/v1/hub/internal-withdrawals', $this->payload(), $this->headers())
            ->assertStatus(201);

        $number = $response->json('data.withdrawal_number');
        $this->assertNotNull($number);
        $response->assertJsonPath('data.status', WithdrawalStatus::PENDING->value);

        $withdrawal = Withdrawal::where('withdrawal_number', $number)->firstOrFail();
        // An internal row carries no merchant — that is what makes it internal.
        $this->assertNull($withdrawal->merchant_id);
        $this->assertSame(HubSystemUser::resolve()->id, $withdrawal->requested_by);
    }

    public function test_it_is_refused_when_the_write_channel_is_disabled(): void
    {
        $this->enable(writeEnabled: false);
        $this->fundPlatform();

        $this->postJson('/api/v1/hub/internal-withdrawals', $this->payload(), $this->headers())
            ->assertStatus(403);

        $this->assertDatabaseCount('withdrawals', 0);
    }

    public function test_it_is_refused_without_the_write_key(): void
    {
        $this->enable();
        $this->fundPlatform();

        $this->postJson(
            '/api/v1/hub/internal-withdrawals',
            $this->payload(),
            ['X-Hub-Key' => self::READ]
        )->assertStatus(403);

        $this->assertDatabaseCount('withdrawals', 0);
    }

    public function test_the_sites_own_balance_guard_still_refuses_an_over_withdrawal(): void
    {
        $this->enable();
        $this->fundPlatform(10000);

        $this->postJson('/api/v1/hub/internal-withdrawals', $this->payload(['amount' => 50000]), $this->headers())
            ->assertStatus(422)
            ->assertJsonPath('message', 'Saldo platform tidak mencukupi untuk penarikan ini.');

        $this->assertDatabaseCount('withdrawals', 0);
    }

    public function test_an_amount_below_the_sites_floor_is_rejected(): void
    {
        $this->enable();
        $this->fundPlatform();

        $this->postJson('/api/v1/hub/internal-withdrawals', $this->payload(['amount' => 100]), $this->headers())
            ->assertStatus(422);

        $this->assertDatabaseCount('withdrawals', 0);
    }

    public function test_a_bank_destination_requires_an_account_number(): void
    {
        $this->enable();
        $this->fundPlatform();

        $this->postJson(
            '/api/v1/hub/internal-withdrawals',
            $this->payload(['bank_code' => 'BCA', 'account_number' => null]),
            $this->headers()
        )->assertStatus(422);
    }

    public function test_the_withdrawal_context_is_served_on_the_read_key_alone(): void
    {
        $this->enable(writeEnabled: false);
        $this->fundPlatform(75000);

        $response = $this->getJson('/api/v1/hub/withdrawal-context', ['X-Hub-Key' => self::READ])
            ->assertOk();

        $response->assertJsonPath('data.available', 75000);
        $this->assertIsInt($response->json('data.fee'));
        $this->assertIsInt($response->json('data.min_amount'));
        $this->assertNotEmpty($response->json('data.banks'));
        // The Hub renders the destination picker from this, so each entry must
        // carry the e-wallet flag that drives the account-number branch.
        $this->assertArrayHasKey('is_ewallet', $response->json('data.banks.0'));
    }

    public function test_the_withdrawal_context_needs_the_read_key(): void
    {
        $this->enable();

        $this->getJson('/api/v1/hub/withdrawal-context')->assertStatus(403);
    }

    /**
     * The whole point of the key: a caller that lost the ack can resend and get
     * its original withdrawal back instead of a second one.
     */
    public function test_replaying_an_idempotency_key_returns_the_same_withdrawal(): void
    {
        $this->enable();
        $this->fundPlatform(200000);
        $payload = $this->payload(['idempotency_key' => 'hub-attempt-1']);

        $first = $this->postJson('/api/v1/hub/internal-withdrawals', $payload, $this->headers())
            ->assertStatus(201);

        $second = $this->postJson('/api/v1/hub/internal-withdrawals', $payload, $this->headers())
            ->assertStatus(201);

        $this->assertSame(
            $first->json('data.withdrawal_number'),
            $second->json('data.withdrawal_number'),
        );
        $this->assertDatabaseCount('withdrawals', 1);
    }

    /**
     * A replay must survive the balance it originally spent being gone —
     * otherwise a retry reads "saldo tidak mencukupi" for money that already
     * left, which is the most alarming possible way to be told "it worked".
     */
    public function test_a_replay_succeeds_even_once_the_balance_is_exhausted(): void
    {
        $this->enable();
        // Exactly enough for one 40k withdrawal and nothing more.
        $this->fundPlatform(40000);
        $payload = $this->payload(['idempotency_key' => 'hub-attempt-2']);

        $this->postJson('/api/v1/hub/internal-withdrawals', $payload, $this->headers())->assertStatus(201);

        // A fresh request for the same amount would now be refused…
        $this->postJson('/api/v1/hub/internal-withdrawals', $this->payload(), $this->headers())
            ->assertStatus(422);

        // …but the replay still resolves.
        $this->postJson('/api/v1/hub/internal-withdrawals', $payload, $this->headers())->assertStatus(201);
        $this->assertDatabaseCount('withdrawals', 1);
    }

    public function test_two_different_keys_are_two_withdrawals(): void
    {
        $this->enable();
        $this->fundPlatform(200000);

        $this->postJson('/api/v1/hub/internal-withdrawals', $this->payload(['idempotency_key' => 'a']), $this->headers())
            ->assertStatus(201);
        $this->postJson('/api/v1/hub/internal-withdrawals', $this->payload(['idempotency_key' => 'b']), $this->headers())
            ->assertStatus(201);

        $this->assertDatabaseCount('withdrawals', 2);
    }

    public function test_a_replay_does_not_notify_finance_twice(): void
    {
        $this->enable();
        $this->fundPlatform(200000);
        $payload = $this->payload(['idempotency_key' => 'hub-attempt-3']);

        $this->postJson('/api/v1/hub/internal-withdrawals', $payload, $this->headers())->assertStatus(201);
        $before = Notification::count();

        $this->postJson('/api/v1/hub/internal-withdrawals', $payload, $this->headers())->assertStatus(201);

        $this->assertSame($before, Notification::count(), 'a replay is not a new request');
    }
}
