<?php

namespace Tests\Feature\Admin;

use App\Enums\RoleType;
use App\Models\HubPlanItem;
use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceSubscription;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The sidebar card is rendered on every admin page, so this endpoint must
 * always answer 200 — every failure mode is a status string, never an error.
 */
class WebsiteSubscriptionTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
    }

    /** The site's own merchant — `DefaultMerchant` falls back to this. */
    private function merchant(): User
    {
        $role = Role::factory()->create(['name' => RoleType::PAYMENT_ADMIN->value]);

        return User::factory()->create(['role_id' => $role->id]);
    }

    private function websiteService(): Service
    {
        return Service::factory()->create(['code' => 'uxiolabs', 'name' => 'Website Topup']);
    }

    private function subscription(User $merchant, Service $service, string $endsAt, string $status = 'ACTIVE'): ServiceSubscription
    {
        return ServiceSubscription::create([
            'merchant_id' => $merchant->id,
            'service_id' => $service->id,
            'starts_at' => now()->subMonth(),
            'ends_at' => $endsAt,
            'status' => $status,
        ]);
    }

    public function test_it_reports_an_active_subscription_with_a_checkout_link(): void
    {
        // A real domain: the link is withheld when the payment page base is not
        // publicly reachable, so the production condition is what to test.
        config(['services.payment_page.url' => 'https://pay.topupgame.id']);

        $this->actingAsAdmin();
        $service = $this->websiteService();
        $this->subscription($this->merchant(), $service, now()->addDays(60)->toDateTimeString());

        $this->getJson('/api/v1/website-subscription')
            ->assertOk()
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.service.code', 'uxiolabs')
            ->assertJsonPath('data.days_remaining', 60)
            ->assertJsonPath('data.checkout_url', config('services.payment_page.url')."/app/payment-admin/services/{$service->id}/checkout");
    }

    public function test_it_reads_the_furthest_end_date_because_renewals_stack(): void
    {
        // A renewal is a new row starting where the old one ended, so the
        // nearest row is never the answer.
        $this->actingAsAdmin();
        $merchant = $this->merchant();
        $service = $this->websiteService();

        $this->subscription($merchant, $service, now()->addDays(5)->toDateTimeString());
        $this->subscription($merchant, $service, now()->addDays(95)->toDateTimeString());

        $this->getJson('/api/v1/website-subscription')
            ->assertOk()
            ->assertJsonPath('data.days_remaining', 95);
    }

    public function test_a_lapsed_subscription_reads_as_expired_not_as_never_subscribed(): void
    {
        // The trap this endpoint exists to avoid: `scopeActive()` also filters
        // `ends_at > now()`, so using it would return nothing here and make an
        // expired subscription indistinguishable from having none.
        $this->actingAsAdmin();
        $this->subscription($this->merchant(), $this->websiteService(), now()->subDays(3)->toDateTimeString());

        $this->getJson('/api/v1/website-subscription')
            ->assertOk()
            ->assertJsonPath('data.status', 'expired')
            ->assertJsonPath('data.days_remaining', 0);
    }

    public function test_it_nags_when_the_subscription_is_close_to_lapsing(): void
    {
        $this->actingAsAdmin();
        $this->subscription($this->merchant(), $this->websiteService(), now()->addDays(9)->toDateTimeString());

        $this->getJson('/api/v1/website-subscription')
            ->assertOk()
            ->assertJsonPath('data.status', 'expiring_soon');
    }

    public function test_never_subscribed_still_returns_the_checkout_link(): void
    {
        config(['services.payment_page.url' => 'https://pay.topupgame.id']);

        // The moment the CTA matters most.
        $this->actingAsAdmin();
        $this->merchant();
        $this->websiteService();

        $this->getJson('/api/v1/website-subscription')
            ->assertOk()
            ->assertJsonPath('data.status', 'none')
            ->assertJsonPath('data.days_remaining', null);

        $this->assertNotNull($this->getJson('/api/v1/website-subscription')->json('data.checkout_url'));
    }

    public function test_it_degrades_to_unconfigured_rather_than_failing(): void
    {
        // No payment-admin user exists, so `DefaultMerchant::id()` is null —
        // a live possibility on a fresh install. The sidebar renders nothing.
        $this->actingAsAdmin();

        $this->getJson('/api/v1/website-subscription')
            ->assertOk()
            ->assertJsonPath('data.status', 'unconfigured')
            ->assertJsonPath('data.checkout_url', null);
    }

    public function test_the_checkout_link_is_withheld_rather_than_pointing_at_a_dev_box(): void
    {
        // The client would otherwise be handed a link to whoever deployed this.
        // The card already renders a null here as "no button".
        config(['services.payment_page.url' => 'http://localhost:5174']);

        $this->actingAsAdmin();
        $merchant = $this->merchant();
        $service = $this->websiteService();
        $this->subscription($merchant, $service, now()->addDays(30)->toDateTimeString());

        $this->getJson('/api/v1/website-subscription')
            ->assertOk()
            ->assertJsonPath('data.checkout_url', null);
    }

    public function test_the_website_service_code_is_configurable(): void
    {
        $this->actingAsAdmin();
        $merchant = $this->merchant();
        Service::factory()->create(['code' => 'uxiolabs', 'name' => 'Default']);
        $custom = Service::factory()->create(['code' => 'my-site', 'name' => 'My Site']);

        Setting::create([
            'group' => 'payment', 'key' => 'website_service_code', 'value' => 'my-site',
            'type' => 'string', 'label' => 'Website Service Code', 'is_public' => false,
        ]);

        $this->subscription($merchant, $custom, now()->addDays(30)->toDateTimeString());

        $this->getJson('/api/v1/website-subscription')
            ->assertOk()
            ->assertJsonPath('data.service.code', 'my-site');
    }

    public function test_it_reports_which_services_govern_the_term(): void
    {
        $this->actingAsAdmin();
        $this->merchant();
        $this->websiteService();

        // The licence itself, plus a billed add-on stacked on it.
        $this->governingItem([
            'service_code' => 'uxiolabs',
            'service_name' => 'Lisensi Situs',
            'period_ends_at' => now()->addDays(365),
        ]);
        $this->governingItem([
            'item_key' => '01LIC:1',
            'period_index' => 1,
            'service_code' => 'extra-mail',
            'service_name' => 'Extra Mail',
            'duration_days' => 30,
            'period_ends_at' => now()->addDays(30),
        ]);
        // A setup fee: billed once, but it does not carry the term, so it must
        // not sit beside the licence as if it did.
        $this->governingItem([
            'item_key' => '01SET:0',
            'service_code' => 'setup',
            'service_name' => 'Setup Fee',
            'governs_licence' => false,
        ]);

        $services = $this->getJson('/api/v1/website-subscription')
            ->assertOk()
            ->json('data.services');

        $this->assertCount(2, $services);
        // The licence leads; the add-on follows.
        $this->assertSame('uxiolabs', $services[0]['service_code']);
        $this->assertSame('extra-mail', $services[1]['service_code']);
        $this->assertTrue($services[0]['governs_licence']);
        $this->assertSame(365, $services[0]['duration_days']);
        $this->assertFalse($services[0]['lifetime']);
        $this->assertNotNull($services[0]['active_until']);
    }

    public function test_a_one_time_governing_line_reads_as_lifetime(): void
    {
        $this->actingAsAdmin();
        $this->merchant();
        $this->websiteService();

        // Bought outright: there is nothing to count down to, so the line must
        // carry no end date rather than invent one.
        $this->governingItem(['billing_mode' => HubPlanItem::MODE_ONE_TIME]);

        $services = $this->getJson('/api/v1/website-subscription')
            ->assertOk()
            ->json('data.services');

        $this->assertCount(1, $services);
        $this->assertTrue($services[0]['lifetime']);
        $this->assertNull($services[0]['active_until']);
    }

    /** One Hub plan line, governing the term unless said otherwise. */
    private function governingItem(array $overrides = []): HubPlanItem
    {
        return HubPlanItem::create(array_merge([
            'item_key' => '01LIC:0',
            'plan_uid' => '01LIC',
            'period_index' => 0,
            'service_code' => 'uxiolabs',
            'service_name' => 'Lisensi Situs',
            'amount' => 12_000_000,
            'duration_days' => 365,
            'billing_mode' => 'billed',
            'governs_licence' => true,
            'period_starts_at' => now()->subDay(),
            'period_ends_at' => now()->addDays(365),
            'due_at' => now(),
            'is_active' => true,
            'synced_at' => now(),
        ], $overrides));
    }
}
