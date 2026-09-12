<?php

namespace Tests\Feature\Notification;

use App\Enums\RoleType;
use App\Models\Notification;
use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Who hears that a subscription is about to lapse.
 *
 * The reminder was raised for the payment-internal team alone — so the only
 * people told were the ones who do not pay the bill, while the client whose
 * site goes dark heard nothing until it did. The client now gets their own row,
 * addressed to them rather than fanned across the `payment-admin` role: every
 * merchant holds that role, and a role fan-out would tell each of them about
 * every other client's billing.
 */
class ExpiringSubscriptionNotificationTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(RoleType $role): User
    {
        return User::factory()->create([
            'role_id' => Role::factory()->create(['name' => $role->value])->id,
        ]);
    }

    /** A subscription lapsing inside the H-7 window, owned by a fresh merchant. */
    private function lapsingSoon(User $merchant): ServiceSubscription
    {
        return ServiceSubscription::factory()->create([
            'merchant_id' => $merchant->id,
            'service_id' => Service::factory()->create(['name' => 'Website Topup'])->id,
            'ends_at' => now()->addDays(2),
        ]);
    }

    public function test_the_owning_client_is_told_their_own_subscription_is_lapsing(): void
    {
        $merchant = $this->userWithRole(RoleType::PAYMENT_ADMIN);
        $this->lapsingSoon($merchant);

        $this->artisan('subscriptions:notify-expiring')->assertSuccessful();

        $row = Notification::where('user_id', $merchant->id)->first();

        $this->assertNotNull($row, 'The client whose site lapses must hear about it.');
        $this->assertSame('subscription_expiring', $row->type);
        $this->assertStringContainsString('Website Topup', $row->message);
        $this->assertSame(2, $row->data['days_left'], 'The client is told the real day count, not the reminder mark.');
    }

    public function test_the_internal_team_still_gets_its_own_row(): void
    {
        // The client's row is additive — finance still needs the same warning,
        // in its own words ("milik {client}" rather than "Langganan Anda").
        $internal = $this->userWithRole(RoleType::PAYMENT_INTERNAL);
        $merchant = $this->userWithRole(RoleType::PAYMENT_ADMIN);
        $this->lapsingSoon($merchant);

        $this->artisan('subscriptions:notify-expiring')->assertSuccessful();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $internal->id,
            'type' => 'subscription_expiring',
        ]);
    }

    public function test_one_clients_reminder_never_lands_on_another_client(): void
    {
        // The reason this is addressed rather than fanned across the role.
        $mine = $this->userWithRole(RoleType::PAYMENT_ADMIN);
        $other = $this->userWithRole(RoleType::PAYMENT_ADMIN);
        $this->lapsingSoon($mine);

        $this->artisan('subscriptions:notify-expiring')->assertSuccessful();

        $this->assertSame(0, Notification::where('user_id', $other->id)->count());
    }

    public function test_a_rerun_the_same_day_does_not_repeat_the_reminder(): void
    {
        // The scheduler runs this daily and the same row is re-selected on
        // consecutive days; the dedupe key is what stops a client being told
        // five times about one expiry.
        $merchant = $this->userWithRole(RoleType::PAYMENT_ADMIN);
        $this->lapsingSoon($merchant);

        $this->artisan('subscriptions:notify-expiring')->assertSuccessful();
        $this->artisan('subscriptions:notify-expiring')->assertSuccessful();

        $this->assertSame(1, Notification::where('user_id', $merchant->id)->count());
    }

    public function test_the_clients_key_and_the_internal_key_do_not_collide(): void
    {
        // Two messages about one fact. Sharing a dedupe namespace would let
        // whichever ran first silence the other.
        $merchant = $this->userWithRole(RoleType::PAYMENT_ADMIN);
        $subscription = $this->lapsingSoon($merchant);

        $this->artisan('subscriptions:notify-expiring')->assertSuccessful();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $merchant->id,
            'dedupe_key' => "subexp-merchant:{$subscription->id}:3",
        ]);
    }

    public function test_a_client_gets_one_reminder_at_the_tightest_mark_that_matches(): void
    {
        // Both windows start at `now`, so a two-day row matches H-7 and H-3 in
        // the same run. The internal team gets both by design (pinned in
        // PaymentPage\NotificationTest); a client must not be sent two reminders
        // at once about one bill, the wider of which overstates how long they
        // have left.
        $merchant = $this->userWithRole(RoleType::PAYMENT_ADMIN);

        $soon = ServiceSubscription::factory()->create([
            'merchant_id' => $merchant->id,
            'service_id' => Service::factory()->create()->id,
            'ends_at' => now()->addDays(2),
        ]);
        $later = ServiceSubscription::factory()->create([
            'merchant_id' => $merchant->id,
            'service_id' => Service::factory()->create()->id,
            'ends_at' => now()->addDays(5),
        ]);

        $this->artisan('subscriptions:notify-expiring')->assertSuccessful();

        $keys = Notification::where('user_id', $merchant->id)->pluck('dedupe_key')->sort()->values()->all();

        $this->assertSame([
            "subexp-merchant:{$soon->id}:3",
            "subexp-merchant:{$later->id}:7",
        ], $keys);
    }

    public function test_a_dry_run_writes_nothing(): void
    {
        $merchant = $this->userWithRole(RoleType::PAYMENT_ADMIN);
        $this->lapsingSoon($merchant);

        $this->artisan('subscriptions:notify-expiring', ['--dry-run' => true])->assertSuccessful();

        $this->assertSame(0, Notification::count());
    }
}
