<?php

declare(strict_types=1);

namespace Tests\Feature\Hub;

use App\Actions\Hub\ApplyHubLicenceAction;
use App\Enums\RoleType;
use App\Enums\SubscriptionStatus;
use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceSubscription;
use App\Models\Setting;
use App\Models\User;
use App\Support\Payment\WebsiteSubscriptionStatus;
use App\Support\SiteLicenceState;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * This site obeying the Hub's licence.
 *
 * Two things are pinned here above all else. The term must land as an ordinary
 * subscription row, because that is what makes the admin sidebar card and the
 * client's "Langganan Saya" tab show it with no new read path. And an
 * unreachable Hub must change nothing — a Hub outage taking five clients'
 * storefronts down would be a far worse incident than a late suspension.
 */
class HubLicenceTest extends TestCase
{
    use RefreshDatabase;

    private Service $service;

    private User $merchant;

    /**
     * The Hub's current answer, mutated between calls.
     *
     * A second `Http::fake()` does NOT replace the first — the earlier stub
     * wins — so these tests drive one closure-backed stub instead of re-faking.
     *
     * @var array<string, mixed>
     */
    private array $licence = [];

    private bool $hubDown = false;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.hub.enabled' => true,
            'services.hub.managed_licence' => true,
            'services.hub.base_url' => 'https://hub.test',
            'services.hub.api_key' => 'site-key',
        ]);

        $this->service = Service::create([
            'code' => 'uxiolabs', 'name' => 'Uxiolabs', 'selling_price' => 1_500_000,
            'duration_days' => 365,
        ]);

        $role = Role::firstOrCreate(['name' => RoleType::PAYMENT_ADMIN->value]);
        $this->merchant = User::factory()->create(['role_id' => $role->id, 'name' => 'ISG Store']);

        SiteLicenceState::forget();

        Http::fake([
            'hub.test/api/v1/sites/licence' => function () {
                return $this->hubDown
                    ? Http::response([], 500)
                    : Http::response(['status' => 'success', 'data' => $this->licence]);
            },
        ]);

        $this->fakeLicence();
    }

    private function fakeLicence(array $overrides = []): void
    {
        $this->licence = array_merge([
            'status' => 'active',
            'suspended' => false,
            'suspend_reason' => null,
            'starts_at' => now()->toIso8601String(),
            'ends_at' => now()->addDays(200)->toIso8601String(),
            'days_remaining' => 200,
            'service_code' => 'uxiolabs',
            'checkout_url' => 'https://pay.test/checkout',
            'site_active' => true,
            'is_serving' => true,
        ], $overrides);
    }

    // ── The term becomes a subscription ──────────────────────────────────────

    public function test_the_hub_term_lands_as_the_sites_own_subscription(): void
    {
        $this->fakeLicence();

        app(ApplyHubLicenceAction::class)->execute();

        $row = ServiceSubscription::where('source', 'hub')->firstOrFail();
        $this->assertSame($this->merchant->id, $row->merchant_id);
        $this->assertSame($this->service->id, $row->service_id);
        // Granted at the Hub, not bought here — the column is nullable for
        // exactly this case.
        $this->assertNull($row->service_invoice_id);
        $this->assertSame(SubscriptionStatus::ACTIVE, $row->status);

        // And therefore the admin sidebar card answers, with no new read path.
        $this->assertSame('active', WebsiteSubscriptionStatus::resolve()['status']);
    }

    public function test_a_second_sync_updates_in_place_rather_than_stacking(): void
    {
        // Renewals stack at the Hub. Stacking the mirror as well would
        // double-count against the max(ends_at) every reader uses.
        $this->fakeLicence();
        app(ApplyHubLicenceAction::class)->execute();

        $this->fakeLicence(['ends_at' => now()->addDays(500)->toIso8601String()]);
        app(ApplyHubLicenceAction::class)->execute();

        $rows = ServiceSubscription::where('source', 'hub')->get();
        $this->assertCount(1, $rows);
        $this->assertSame(now()->addDays(500)->toDateString(), $rows->first()->ends_at->toDateString());
    }

    public function test_a_renewal_revives_a_row_the_nightly_sweep_expired(): void
    {
        // services:expire flips the row to EXPIRED once the term lapses —
        // correct while it is lapsed, and fatal afterwards if it stayed that
        // way, because the admin card only counts ACTIVE rows.
        $this->fakeLicence(['ends_at' => now()->subDay()->toIso8601String()]);
        app(ApplyHubLicenceAction::class)->execute();
        ServiceSubscription::where('source', 'hub')->update(['status' => SubscriptionStatus::EXPIRED]);

        $this->fakeLicence(['ends_at' => now()->addYear()->toIso8601String()]);
        app(ApplyHubLicenceAction::class)->execute();

        $this->assertSame(
            SubscriptionStatus::ACTIVE,
            ServiceSubscription::where('source', 'hub')->firstOrFail()->status,
        );
        $this->assertSame('active', WebsiteSubscriptionStatus::resolve()['status']);
    }

    public function test_billing_that_is_not_wired_up_yet_is_skipped_not_faked(): void
    {
        $this->merchant->delete();
        $this->fakeLicence();

        app(ApplyHubLicenceAction::class)->execute();

        // No merchant to own it — inventing a row would be worse than none.
        $this->assertSame(0, ServiceSubscription::count());
        // The gate still learned what it needed to.
        $this->assertTrue(SiteLicenceState::isServing());
    }

    // ── The gate ─────────────────────────────────────────────────────────────

    public function test_a_suspension_closes_the_public_side(): void
    {
        $this->fakeLicence([
            'status' => 'suspended',
            'suspended' => true,
            'suspend_reason' => 'Belum bayar',
            'is_serving' => false,
        ]);

        app(ApplyHubLicenceAction::class)->execute();

        $this->assertFalse(SiteLicenceState::isServing());
        $this->assertSame('Belum bayar', SiteLicenceState::closure()['reason']);
    }

    public function test_an_unreachable_hub_changes_nothing(): void
    {
        // The failure that matters most: a Hub outage must not take five
        // clients' storefronts down. A serving site keeps serving.
        $this->fakeLicence();
        app(ApplyHubLicenceAction::class)->execute();

        $this->hubDown = true;

        $this->artisan('hub:sync-licence')->assertExitCode(1);

        SiteLicenceState::forget();
        $this->assertTrue(SiteLicenceState::isServing());
    }

    public function test_a_site_that_never_synced_serves(): void
    {
        // A fresh deployment, or one whose first sync has not run yet. Silence
        // is not evidence of a lapse.
        $this->assertTrue(SiteLicenceState::isServing());
    }

    public function test_a_recorded_suspension_survives_silence_indefinitely(): void
    {
        // Deliberately NO amnesty after N hours of no contact: that would teach
        // a delinquent client that blocking the Hub brings their site back.
        $this->fakeLicence(['is_serving' => false, 'status' => 'suspended', 'suspended' => true]);
        app(ApplyHubLicenceAction::class)->execute();

        $this->travel(90)->days();
        SiteLicenceState::forget();

        $this->assertFalse(SiteLicenceState::isServing());
    }

    // ── Naming ───────────────────────────────────────────────────────────────

    public function test_the_label_follows_the_site_not_the_hubs_catalog(): void
    {
        // hub:sync-catalog rewrites services.name every 15 minutes, so a local
        // rename would not survive. The label comes from the site's identity.
        Setting::create([
            'group' => 'general', 'key' => 'site_name', 'value' => 'ISG Store',
            'type' => 'string', 'label' => 'Site Name', 'is_public' => true,
        ]);
        $this->fakeLicence();
        app(ApplyHubLicenceAction::class)->execute();

        $this->assertSame('ISG Store', WebsiteSubscriptionStatus::resolve()['service']['name']);
        // The catalog row itself is untouched — it still belongs to the Hub.
        $this->assertSame('Uxiolabs', $this->service->fresh()->name);
    }
}
