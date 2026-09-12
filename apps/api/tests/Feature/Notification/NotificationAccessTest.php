<?php

namespace Tests\Feature\Notification;

use App\Actions\Notification\NotifyUserAction;
use App\Enums\RoleType;
use App\Models\Notification;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Who may read a notification feed, and whose rows come back.
 *
 * The feed was built for the payment-internal team and its routes were
 * registered only under `v1/payment-internal`. Meanwhile `ClaimRefundWithAccountAction`
 * had been writing rows addressed to role `admin` on every refund claim — the
 * comment beside it calls them "the one that actually queues work for an admin"
 * — and no route existed through which an admin could read one. The rows piled
 * up unread because they were unreadable.
 *
 * The controller was already the safe part: every query is scoped to
 * `$request->user()->id` before any filter. That is what lets one controller
 * serve three panels — the route group decides who may ask, never whose rows
 * come back — and it is the property these tests pin.
 */
class NotificationAccessTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(RoleType $role): User
    {
        return User::factory()->create([
            'role_id' => Role::factory()->create(['name' => $role->value])->id,
        ]);
    }

    private function notify(User $user, string $type = 'refund.claimed'): Notification
    {
        app(NotifyUserAction::class)->execute(
            userId: $user->id,
            type: $type,
            title: 'Klaim pengembalian dana baru',
            message: 'Menunggu verifikasi.',
        );

        return Notification::where('user_id', $user->id)->latest('id')->firstOrFail();
    }

    // ── The door that was missing ───────────────────────────────────────────

    public function test_an_admin_can_read_the_notifications_written_for_them(): void
    {
        $admin = $this->userWithRole(RoleType::ADMIN);
        $this->notify($admin);

        Sanctum::actingAs($admin, ['access-api']);

        $this->getJson('/api/v1/notifications')
            ->assertOk()
            ->assertJsonPath('data.data.0.type', 'refund.claimed');

        $this->getJson('/api/v1/notifications/unread-count')
            ->assertOk()
            ->assertJsonPath('data.unread_count', 1);
    }

    public function test_a_client_merchant_can_read_their_own(): void
    {
        $merchant = $this->userWithRole(RoleType::PAYMENT_ADMIN);
        $this->notify($merchant, 'subscription_expiring');

        Sanctum::actingAs($merchant, ['access-api']);

        $this->getJson('/api/v1/payment-admin/notifications')
            ->assertOk()
            ->assertJsonPath('data.data.0.type', 'subscription_expiring');
    }

    // ── The scoping that makes one controller safe for three panels ─────────

    public function test_one_recipients_rows_are_invisible_to_another(): void
    {
        $mine = $this->userWithRole(RoleType::ADMIN);
        $theirs = $this->userWithRole(RoleType::ADMIN);
        $this->notify($theirs);

        Sanctum::actingAs($mine, ['access-api']);

        $this->getJson('/api/v1/notifications')
            ->assertOk()
            ->assertJsonCount(0, 'data.data');

        $this->getJson('/api/v1/notifications/unread-count')
            ->assertJsonPath('data.unread_count', 0);
    }

    public function test_marking_someone_elses_row_read_is_refused(): void
    {
        $mine = $this->userWithRole(RoleType::ADMIN);
        $theirs = $this->userWithRole(RoleType::ADMIN);
        $row = $this->notify($theirs);

        Sanctum::actingAs($mine, ['access-api']);

        $this->postJson("/api/v1/notifications/{$row->id}/read")->assertNotFound();

        $this->assertNull($row->fresh()->read_at, 'A foreign row must not be marked read by a 404 that still wrote.');
    }

    public function test_mark_all_read_clears_only_the_callers_badge(): void
    {
        $mine = $this->userWithRole(RoleType::ADMIN);
        $theirs = $this->userWithRole(RoleType::ADMIN);
        $this->notify($mine);
        $theirRow = $this->notify($theirs);

        Sanctum::actingAs($mine, ['access-api']);

        $this->postJson('/api/v1/notifications/read-all')
            ->assertOk()
            ->assertJsonPath('data.marked', 1);

        $this->assertNotNull(Notification::where('user_id', $mine->id)->first()->read_at);
        $this->assertNull($theirRow->fresh()->read_at);
    }

    // ── The route group still decides who may ask ───────────────────────────

    public function test_a_client_merchant_cannot_reach_the_admin_feed(): void
    {
        // Both groups serve the same controller, so the guard has to be the
        // middleware. If it ever stops being, this is where it shows.
        $merchant = $this->userWithRole(RoleType::PAYMENT_ADMIN);
        Sanctum::actingAs($merchant, ['access-api']);

        $this->getJson('/api/v1/notifications')->assertForbidden();
    }

    public function test_an_admin_cannot_reach_the_merchant_feed(): void
    {
        $admin = $this->userWithRole(RoleType::ADMIN);
        Sanctum::actingAs($admin, ['access-api']);

        $this->getJson('/api/v1/payment-admin/notifications')->assertForbidden();
    }

    public function test_the_feed_is_closed_to_anonymous_callers(): void
    {
        $this->getJson('/api/v1/notifications')->assertUnauthorized();
        $this->getJson('/api/v1/payment-admin/notifications')->assertUnauthorized();
    }

    // ── The unread filter the bell badge depends on ─────────────────────────

    public function test_the_unread_filter_narrows_to_the_badge_set(): void
    {
        $admin = $this->userWithRole(RoleType::ADMIN);
        $read = $this->notify($admin);
        $this->notify($admin, 'refund.claimed');
        $read->update(['read_at' => now()]);

        Sanctum::actingAs($admin, ['access-api']);

        $this->getJson('/api/v1/notifications?filter=unread')
            ->assertOk()
            ->assertJsonCount(1, 'data.data');
    }
}
