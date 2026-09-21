<?php

declare(strict_types=1);

namespace Tests\Feature\Hub;

use App\Actions\Hub\ApplyHubLicenceAction;
use App\Enums\RoleType;
use App\Enums\ServiceInvoiceStatus;
use App\Enums\SubscriptionStatus;
use App\Jobs\PushLicenceRenewalJob;
use App\Models\HubPlanItem;
use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceInvoice;
use App\Models\ServiceSubscription;
use App\Models\Setting;
use App\Models\User;
use App\Services\HubClient;
use App\Support\Payment\WebsiteSubscriptionStatus;
use App\Support\SiteLicenceState;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
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
            // The site→Hub renewal push. Stubbed here so a test that exercises
            // `handle()` never reaches the network.
            'hub.test/api/v1/sites/licence-renewal' => Http::response([
                'status' => 'success',
                'data' => ['applied' => true],
            ]),
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

        // And the client's own admin card says so, rather than reading "aktif,
        // 200 hari tersisa" while their storefront answers 503 to every
        // customer — the one screen that should explain the outage denying it.
        $card = WebsiteSubscriptionStatus::resolve();
        $this->assertSame('suspended', $card['status']);
        $this->assertFalse($card['is_serving']);
        $this->assertSame('Belum bayar', $card['suspend_reason']);
        $this->assertNotNull($card['checkout_url']);
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

    public function test_a_site_that_never_synced_is_dark_until_the_hub_answers(): void
    {
        // A fresh deployment, or one whose first sync has not run yet. Silence
        // is not permission: a Hub-managed site is CLOSED until the Hub says it
        // may serve — "not yet provisioned" is not "allowed".
        $this->assertFalse(SiteLicenceState::isServing());

        // The Hub's first answer opens it, with nothing else changing.
        $this->fakeLicence();
        app(ApplyHubLicenceAction::class)->execute();

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
        // hub:sync-catalog rewrites services.name every minute, so a local
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

    // ── Bought outright ──────────────────────────────────────────────────────

    /**
     * A licence bought outright is paid for with no end date, and lands here as
     * a subscription with none.
     *
     * The row still has to be WRITTEN: a null end date on its own is also what
     * "never subscribed" looks like, and skipping the row would leave a client
     * who paid in full reading "belum berlangganan" in their own admin.
     */
    public function test_a_lifetime_licence_lands_as_a_subscription_with_no_end_date(): void
    {
        $this->fakeLicence(['lifetime' => true, 'ends_at' => null, 'days_remaining' => null]);

        $report = app(ApplyHubLicenceAction::class)->execute();

        $this->assertTrue($report['lifetime']);
        $this->assertTrue($report['subscription']);
        $this->assertTrue(SiteLicenceState::isLifetime());
        $this->assertTrue(SiteLicenceState::isServing());

        $row = ServiceSubscription::where('source', 'hub')->firstOrFail();
        $this->assertNull($row->ends_at);
        $this->assertTrue($row->isLifetime());
        $this->assertSame(SubscriptionStatus::ACTIVE, $row->status);

        // And the window-less row is still inside its window: a raw
        // `ends_at > now()` would have hidden the very subscription the client
        // paid for.
        $this->assertSame(1, ServiceSubscription::query()->active()->count());
    }

    /** The card says "aktif", not "belum berlangganan", on a site paid off in full. */
    public function test_the_card_reads_a_lifetime_licence_as_active(): void
    {
        $this->fakeLicence(['lifetime' => true, 'ends_at' => null, 'days_remaining' => null]);
        app(ApplyHubLicenceAction::class)->execute();

        $card = WebsiteSubscriptionStatus::resolve();

        $this->assertSame('active', $card['status']);
        $this->assertTrue($card['lifetime']);
        $this->assertNull($card['ends_at']);
        // Nothing to count down to, and nothing to nag about.
        $this->assertNull($card['days_remaining']);
    }

    /** The ordinary dated licence is untouched by any of this. */
    public function test_a_dated_licence_is_not_reported_as_lifetime(): void
    {
        app(ApplyHubLicenceAction::class)->execute();

        $this->assertFalse(SiteLicenceState::isLifetime());
        $this->assertFalse(WebsiteSubscriptionStatus::resolve()['lifetime']);
        $this->assertNotNull(ServiceSubscription::where('source', 'hub')->firstOrFail()->ends_at);
    }

    // ── Reporting the payment that bought it ─────────────────────────────────

    /**
     * A licence bill the Hub never acknowledged is reported again.
     *
     * The report is one-shot, so a bill settled while the dispatch was broken —
     * or while the Hub was permanently unreachable — leaves a client who has PAID
     * looking at a dark site with nothing anywhere reporting a problem. Re-sending
     * is safe: the Hub de-dupes on the invoice number, so a redelivery cannot buy
     * a second term.
     */
    public function test_a_paid_licence_the_hub_never_acknowledged_is_reported_again(): void
    {
        Queue::fake();

        $this->paidLicenceInvoice();

        // The Hub's answer: this site holds no licence at all.
        $this->fakeLicence(['status' => 'none', 'ends_at' => null, 'is_serving' => false]);

        app(ApplyHubLicenceAction::class)->execute();

        Queue::assertPushed(PushLicenceRenewalJob::class);
    }

    /**
     * A LAPSED licence is not a missing one.
     *
     * It has an end date, so the site knows the Hub has heard it — re-sending the
     * old bill would push at the Hub every minute forever for a client who simply
     * has not renewed.
     */
    public function test_a_lapsed_licence_is_not_reported_again(): void
    {
        Queue::fake();

        $this->paidLicenceInvoice();

        $this->fakeLicence([
            'status' => 'expired',
            'ends_at' => now()->subDay()->toIso8601String(),
            'is_serving' => false,
        ]);

        app(ApplyHubLicenceAction::class)->execute();

        Queue::assertNotPushed(PushLicenceRenewalJob::class);
    }

    /** The site's own subscription, paid — with the plan line that governs behind it. */
    private function paidLicenceInvoice(): ServiceInvoice
    {
        HubPlanItem::create([
            'item_key' => '01LIC:0',
            'plan_uid' => '01LIC',
            'period_index' => 0,
            'service_code' => 'uxiolabs',
            'service_name' => 'Lisensi Situs',
            'amount' => 12_000_000,
            'duration_days' => 365,
            'billing_mode' => 'billed',
            'governs_licence' => true,
            'period_starts_at' => now(),
            'period_ends_at' => now()->addDays(365),
            'due_at' => now(),
            'is_active' => true,
            'synced_at' => now(),
        ]);

        return ServiceInvoice::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'billing_mode' => 'billed',
            'status' => ServiceInvoiceStatus::PAID,
            'verified_at' => now(),
            'hub_item_key' => '01LIC:0',
        ]);
    }

    /**
     * A one-time LICENCE is the one one-time bill that moves the term.
     *
     * The one-time gate exists so a setup fee cannot light a site for good; this
     * is the case it must let through, and it needs BOTH halves — the plan line
     * governing the term AND the website service — so a one-time fee for
     * anything else still renews nothing.
     */
    public function test_a_paid_one_time_licence_is_reported_as_lifetime(): void
    {
        Queue::fake();

        PushLicenceRenewalJob::maybeDispatch($this->oneTimeLicenceInvoice());

        Queue::assertPushed(PushLicenceRenewalJob::class);
    }

    public function test_a_one_time_fee_that_does_not_govern_the_term_is_not_reported(): void
    {
        Queue::fake();

        $this->licenceItem(['governs_licence' => false]);

        PushLicenceRenewalJob::maybeDispatch($this->oneTimeInvoice());

        Queue::assertNotPushed(PushLicenceRenewalJob::class);
    }

    /** The push carries `lifetime` instead of `days` — the Hub refuses both. */
    public function test_the_lifetime_push_carries_no_days(): void
    {
        $invoice = $this->oneTimeLicenceInvoice();

        (new PushLicenceRenewalJob($invoice))->handle(app(HubClient::class));

        Http::assertSent(fn ($request) => $request['invoice_number'] === $invoice->invoice_number
            && $request['lifetime'] === true
            && ! array_key_exists('days', $request->data()));
    }

    /** A one-time bill for the licence, with the plan line that governs behind it. */
    private function oneTimeLicenceInvoice(): ServiceInvoice
    {
        $this->licenceItem();

        return $this->oneTimeInvoice();
    }

    private function oneTimeInvoice(): ServiceInvoice
    {
        return ServiceInvoice::factory()->create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $this->service->id,
            'billing_mode' => 'one_time',
            'hub_item_key' => '01LIC:0',
        ]);
    }

    /** @param array<string, mixed> $overrides */
    private function licenceItem(array $overrides = []): HubPlanItem
    {
        return HubPlanItem::create(array_merge([
            'item_key' => '01LIC:0',
            'plan_uid' => '01LIC',
            'period_index' => 0,
            'service_code' => 'uxiolabs',
            'service_name' => 'Uxiolabs',
            'amount' => 12_000_000,
            'duration_days' => 365,
            'billing_mode' => 'one_time',
            'governs_licence' => true,
            'period_starts_at' => now(),
            'period_ends_at' => now()->addDays(365),
            'due_at' => now(),
            'is_active' => true,
            'synced_at' => now(),
        ], $overrides));
    }
}
