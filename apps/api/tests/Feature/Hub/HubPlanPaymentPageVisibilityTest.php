<?php

declare(strict_types=1);

namespace Tests\Feature\Hub;

use App\Actions\Hub\ApplyHubPlanAction;
use App\Enums\ServiceInvoiceStatus;
use App\Enums\SubscriptionStatus;
use App\Jobs\PushLicenceRenewalJob;
use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceInvoice;
use App\Models\ServiceSubscription;
use App\Models\Setting;
use App\Models\User;
use App\Support\SiteLicenceState;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The end of the Hub's plan is the client's payment page.
 *
 * `ApplyHubPlanAction` is covered elsewhere — it issues the bill, carries the
 * negotiated price, honours `hub_item_key`. What nothing pinned was the step
 * after: that the bill it created is actually VISIBLE to the client who logs
 * into the payment page. Both the list and the plan read-scope on
 * `merchant_id = $request->user()->id`, and the Hub attributes its bills to
 * `DefaultMerchant::id()`. If those two ever disagree, the client holds a bill
 * no screen will show them — which is exactly the failure this flow was reported
 * for.
 */
class HubPlanPaymentPageVisibilityTest extends TestCase
{
    use RefreshDatabase;

    private User $merchant;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.hub.enabled' => true,
            'services.hub.managed_plan' => true,
            // Not part of this flow, and it would enqueue a real push on issue.
            'services.hub.push_orders' => false,
            'services.hub.base_url' => 'https://hub.test',
            'services.hub.api_key' => 'hub_live_key',
        ]);

        $this->merchant = User::factory()->create([
            'role_id' => Role::firstOrCreate(['name' => 'Payment-Admin'])->id,
        ]);

        Setting::updateOrCreate(
            ['group' => 'payment', 'key' => 'website_service_code'],
            ['value' => 'website', 'type' => 'string'],
        );
    }

    private function service(string $code, string $name, int $price): Service
    {
        return Service::factory()->create([
            'code' => $code,
            'name' => $name,
            'selling_price' => $price,
            'duration_days' => 365,
        ]);
    }

    /** @param array<string, mixed> $overrides */
    private function period(array $overrides = []): array
    {
        return [
            'item_key' => '01WEB:0',
            'plan_uid' => '01WEB',
            'period_index' => 0,
            'service_code' => 'website',
            'service_name' => 'Langganan Website',
            'amount' => 1500000,
            'duration_days' => 365,
            'period_starts_at' => now()->toIso8601String(),
            'period_ends_at' => now()->addDays(365)->toIso8601String(),
            'due_at' => now()->toIso8601String(),
            'billing_mode' => 'billed',
            'governs_licence' => true,
            'is_active' => true,
            ...$overrides,
        ];
    }

    /** The opening plan: a recurring term plus a one-time setup fee, both due now. */
    private function syncOpeningPlan(): void
    {
        $this->service('website', 'Langganan Website', 1500000);
        $this->service('setup', 'Biaya Setup', 500000);

        Http::preventStrayRequests();
        Http::fake([
            'hub.test/api/v1/sites/plan' => Http::response([
                'status' => 'success',
                'code' => 200,
                'message' => 'ok',
                'data' => [
                    $this->period(),
                    $this->period([
                        'item_key' => '01SETUP:0',
                        'plan_uid' => '01SETUP',
                        'service_code' => 'setup',
                        'service_name' => 'Biaya Setup',
                        'amount' => 500000,
                        'billing_mode' => 'one_time',
                        'governs_licence' => false,
                    ]),
                ],
            ]),
        ]);

        $this->assertSame(2, app(ApplyHubPlanAction::class)->execute()['issued']);
    }

    private function asMerchant(): void
    {
        Sanctum::actingAs($this->merchant, ['access-api']);
    }

    public function test_the_client_sees_every_hub_issued_bill_on_the_payment_page(): void
    {
        $this->syncOpeningPlan();
        $this->asMerchant();

        $response = $this->getJson('/api/v1/payment-admin/service-invoices')->assertOk();

        $rows = $response->json('data.data');
        $this->assertCount(2, $rows);
        // Both are Hub-issued, and both are billed to the client who is looking.
        $this->assertSame(['hub_plan'], array_values(array_unique(array_column($rows, 'source'))));
        $this->assertSame(
            [$this->merchant->id],
            array_values(array_unique(array_map('intval', ServiceInvoice::pluck('merchant_id')->all()))),
        );
        $this->assertSame(
            ['01SETUP:0', '01WEB:0'],
            array_values(array_unique(ServiceInvoice::pluck('hub_item_key')->sort()->values()->all())),
        );
    }

    public function test_the_payment_page_shows_what_the_client_owes_for_each_line(): void
    {
        $this->syncOpeningPlan();
        $this->asMerchant();

        $plan = $this->getJson('/api/v1/payment-admin/service-plan')->assertOk()->json('data');

        $byCode = collect($plan)->keyBy('service_code');

        // The one-time setup fee is billed now and renews nothing.
        $this->assertSame('one_time', $byCode['setup']['billing_mode']);
        $this->assertSame(500000, $byCode['setup']['outstanding_total']);

        // The recurring term is billed now, and paying it is what lights the site.
        $this->assertSame('billed', $byCode['website']['billing_mode']);
        $this->assertTrue($byCode['website']['governs_licence']);
        $this->assertSame(1500000, $byCode['website']['outstanding_total']);
    }

    /**
     * A licence bought outright reads as PAID, not as never-subscribed.
     *
     * A lifetime grant is a window-less subscription row, so `active_until` is
     * null for it — the same null that means "nothing was ever paid". The flag
     * travels beside the date, because otherwise the client's own panel tells
     * somebody who has paid in full that they owe nothing and hold nothing.
     */
    public function test_a_lifetime_licence_reads_as_paid_not_as_never_paid(): void
    {
        $this->syncOpeningPlan();

        $service = Service::where('code', 'website')->firstOrFail();

        ServiceSubscription::create([
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'source' => 'hub',
            'starts_at' => now(),
            // NULL is the lifetime sentinel; see the migration.
            'ends_at' => null,
            'status' => SubscriptionStatus::ACTIVE,
        ]);

        $this->asMerchant();

        $rows = collect($this->getJson('/api/v1/payment-admin/service-plan')->assertOk()->json('data'))
            ->keyBy('service_code');

        $this->assertTrue($rows['website']['lifetime']);
        $this->assertNull($rows['website']['active_until']);
    }

    /**
     * The Hub's verdict is the licence line's paid state, not only the mirrored
     * subscription row.
     *
     * That mirror is attached to `DefaultMerchant` + `WebsiteService`, and a
     * service-code or merchant mismatch there is exactly what left a licence the
     * client had PAID FOR reading "never paid" on their own panel. This creates
     * NO subscription row on purpose: the Hub's answer alone must be enough.
     */
    public function test_a_hub_lifetime_licence_reads_as_paid_without_a_subscription_row(): void
    {
        $this->syncOpeningPlan();

        Setting::updateOrCreate(
            ['group' => SiteLicenceState::GROUP, 'key' => 'lifetime'],
            ['value' => '1', 'type' => 'boolean'],
        );
        SiteLicenceState::forget();

        $this->asMerchant();

        $rows = collect($this->getJson('/api/v1/payment-admin/service-plan')->assertOk()->json('data'))
            ->keyBy('service_code');

        $this->assertTrue($rows['website']['lifetime']);
        $this->assertNull($rows['website']['active_until']);
    }

    /** A licence with a real period shows the date the Hub set, not "never paid". */
    public function test_a_hub_dated_licence_fills_active_until(): void
    {
        $this->syncOpeningPlan();

        $endsAt = now()->addDays(30);

        Setting::updateOrCreate(
            ['group' => SiteLicenceState::GROUP, 'key' => 'lifetime'],
            ['value' => '0', 'type' => 'boolean'],
        );
        Setting::updateOrCreate(
            ['group' => SiteLicenceState::GROUP, 'key' => 'status'],
            ['value' => 'active', 'type' => 'string'],
        );
        Setting::updateOrCreate(
            ['group' => SiteLicenceState::GROUP, 'key' => 'ends_at'],
            ['value' => $endsAt->toIso8601String(), 'type' => 'string'],
        );
        SiteLicenceState::forget();

        $this->asMerchant();

        $rows = collect($this->getJson('/api/v1/payment-admin/service-plan')->assertOk()->json('data'))
            ->keyBy('service_code');

        $this->assertFalse($rows['website']['lifetime']);
        $this->assertSame($endsAt->toIso8601String(), $rows['website']['active_until']);
    }

    /**
     * Paying the governing bill is what turns the site on: it is reported to the
     * Hub as a renewal. Without the Hub connection the bill could not exist in
     * the first place, so this is the far end of the same flow.
     */
    public function test_the_governing_bill_still_drives_the_licence_renewal(): void
    {
        Queue::fake();

        $this->syncOpeningPlan();

        $governing = ServiceInvoice::where('hub_item_key', '01WEB:0')->firstOrFail();
        $governing->update([
            'status' => ServiceInvoiceStatus::PAID,
            'verified_at' => now(),
        ]);

        PushLicenceRenewalJob::maybeDispatch($governing->fresh());

        Queue::assertPushed(PushLicenceRenewalJob::class);
    }
}
