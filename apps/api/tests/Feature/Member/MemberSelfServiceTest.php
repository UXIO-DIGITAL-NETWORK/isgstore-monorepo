<?php

namespace Tests\Feature\Member;

use App\Enums\ActivityType;
use App\Enums\TransactionStatus;
use App\Models\ActivityLog;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MemberSelfServiceTest extends TestCase
{
    use RefreshDatabase;

    private function member(array $attributes = []): User
    {
        $role = Role::factory()->create(['name' => 'Member']);
        $user = User::factory()->create(array_merge(['role_id' => $role->id], $attributes));
        Sanctum::actingAs($user, ['access-api']);

        return $user;
    }

    public function test_member_endpoints_require_authentication(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized();
        $this->getJson('/api/v1/me/dashboard')->assertUnauthorized();
        $this->getJson('/api/v1/me/transactions')->assertUnauthorized();
        $this->getJson('/api/v1/me/activity-logs')->assertUnauthorized();
    }

    public function test_dashboard_aggregates_the_callers_own_orders_only(): void
    {
        $user = $this->member(['balance' => 75000, 'point' => 120]);
        $other = User::factory()->create(['role_id' => $user->role_id]);

        Transaction::factory()->create(['user_id' => $user->id, 'status' => TransactionStatus::COMPLETED, 'amount_total' => 26000]);
        Transaction::factory()->create(['user_id' => $user->id, 'status' => TransactionStatus::PENDING, 'amount_total' => 10000]);
        Transaction::factory()->create(['user_id' => $other->id, 'status' => TransactionStatus::COMPLETED, 'amount_total' => 999000]);

        $this->getJson('/api/v1/me/dashboard')
            ->assertOk()
            ->assertJsonPath('data.wallet.balance', 75000)
            ->assertJsonPath('data.wallet.points', 120)
            ->assertJsonPath('data.stats.total', 2)
            ->assertJsonPath('data.stats.success', 1)
            ->assertJsonPath('data.stats.pending', 1)
            // Only completed orders count as money spent, and the other
            // customer's 999000 must not appear anywhere.
            ->assertJsonPath('data.total_spent', 26000);
    }

    public function test_transaction_history_is_scoped_to_the_caller(): void
    {
        $user = $this->member();
        $other = User::factory()->create(['role_id' => $user->role_id]);

        Transaction::factory()->create(['user_id' => $user->id, 'invoice_number' => 'INV-MINE']);
        Transaction::factory()->create(['user_id' => $other->id, 'invoice_number' => 'INV-THEIRS']);

        $response = $this->getJson('/api/v1/me/transactions')->assertOk();

        $this->assertSame(['INV-MINE'], collect($response->json('data.data'))->pluck('invoice_number')->all());
    }

    public function test_transaction_history_filters_by_status_and_sorts_by_price(): void
    {
        $user = $this->member();

        Transaction::factory()->create(['user_id' => $user->id, 'status' => TransactionStatus::COMPLETED, 'amount_total' => 10000]);
        Transaction::factory()->create(['user_id' => $user->id, 'status' => TransactionStatus::COMPLETED, 'amount_total' => 50000]);
        Transaction::factory()->create(['user_id' => $user->id, 'status' => TransactionStatus::PENDING, 'amount_total' => 99000]);

        $this->getJson('/api/v1/me/transactions?status=COMPLETED')
            ->assertOk()
            ->assertJsonCount(2, 'data.data');

        $this->getJson('/api/v1/me/transactions?status=COMPLETED&sort=priceHigh')
            ->assertOk()
            ->assertJsonPath('data.data.0.amount', 50000);
    }

    public function test_transaction_history_never_exposes_margin(): void
    {
        $user = $this->member();
        Transaction::factory()->create(['user_id' => $user->id, 'margin' => 6000]);

        $this->getJson('/api/v1/me/transactions')
            ->assertOk()
            ->assertJsonMissing(['margin' => 6000]);
    }

    public function test_profile_update_changes_the_callers_own_details(): void
    {
        $this->member(['name' => 'Lama']);

        $this->putJson('/api/v1/me', ['name' => 'Budi Baru', 'username' => 'budibaru'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Budi Baru')
            ->assertJsonPath('data.username', 'budibaru');
    }

    public function test_profile_update_allows_resubmitting_unchanged_values(): void
    {
        $user = $this->member(['username' => 'budisan']);

        // Uniqueness must ignore the caller's own row, or saving an untouched
        // form fails validation.
        $this->putJson('/api/v1/me', ['username' => 'budisan', 'email' => $user->email])
            ->assertOk();
    }

    public function test_password_change_requires_the_current_password(): void
    {
        $this->member(['password' => Hash::make('oldsecret')]);

        $this->putJson('/api/v1/me/password', [
            'current_password' => 'wrong',
            'password' => 'newsecret123',
            'password_confirmation' => 'newsecret123',
        ])
            ->assertStatus(422)
            ->assertJsonPath('errors.current_password.0', 'Password saat ini tidak sesuai.');
    }

    public function test_password_change_succeeds_with_the_correct_current_password(): void
    {
        $user = $this->member(['password' => Hash::make('oldsecret')]);

        $this->putJson('/api/v1/me/password', [
            'current_password' => 'oldsecret',
            'password' => 'newsecret123',
            'password_confirmation' => 'newsecret123',
        ])->assertOk();

        $this->assertTrue(Hash::check('newsecret123', $user->fresh()->password));
    }

    public function test_activity_log_is_scoped_to_the_caller_and_filterable_by_type(): void
    {
        $user = $this->member();
        $other = User::factory()->create(['role_id' => $user->role_id]);

        ActivityLog::factory()->create(['user_id' => $user->id, 'type' => ActivityType::LOGIN->value, 'message' => 'mine-login']);
        ActivityLog::factory()->create(['user_id' => $user->id, 'type' => ActivityType::SECURITY->value, 'message' => 'mine-security']);
        ActivityLog::factory()->create(['user_id' => $other->id, 'type' => ActivityType::LOGIN->value, 'message' => 'theirs']);

        $this->getJson('/api/v1/me/activity-logs')->assertOk()->assertJsonCount(2, 'data.data');

        $this->getJson('/api/v1/me/activity-logs?type=login')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.message', 'mine-login');
    }

    public function test_rating_requires_owning_a_completed_transaction(): void
    {
        $user = $this->member();
        $other = User::factory()->create(['role_id' => $user->role_id]);

        $theirs = Transaction::factory()->create([
            'user_id' => $other->id,
            'invoice_number' => 'INV-THEIRS',
            'status' => TransactionStatus::COMPLETED,
        ]);
        $unfinished = Transaction::factory()->create([
            'user_id' => $user->id,
            'invoice_number' => 'INV-UNFINISHED',
            'status' => TransactionStatus::PENDING,
        ]);

        $this->postJson("/api/v1/me/transactions/{$theirs->invoice_number}/rating", ['rating' => 5])->assertStatus(422);
        $this->postJson("/api/v1/me/transactions/{$unfinished->invoice_number}/rating", ['rating' => 5])->assertStatus(422);
    }

    public function test_a_transaction_can_only_be_rated_once(): void
    {
        $user = $this->member();
        $transaction = Transaction::factory()->create([
            'user_id' => $user->id,
            'invoice_number' => 'INV-RATEABLE',
            'status' => TransactionStatus::COMPLETED,
        ]);

        $this->postJson("/api/v1/me/transactions/{$transaction->invoice_number}/rating", ['rating' => 5, 'comment' => 'Cepat!'])
            ->assertCreated();

        // Otherwise one purchase could be replayed to flood the average.
        $this->postJson("/api/v1/me/transactions/{$transaction->invoice_number}/rating", ['rating' => 1])
            ->assertStatus(422);

        $this->assertDatabaseHas('ratings', [
            'transaction_id' => $transaction->id,
            'rating' => 5,
            'comment' => 'Cepat!',
        ]);
    }
}
