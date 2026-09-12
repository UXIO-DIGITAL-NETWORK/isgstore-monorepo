<?php

declare(strict_types=1);

namespace Tests\Feature\Hub;

use App\Actions\Hub\ApplyHubPlanAction;
use App\Enums\ServiceInvoiceStatus;
use App\Enums\SubscriptionStatus;
use App\Models\PlatformMutation;
use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceInvoice;
use App\Models\ServiceSubscription;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Turning the Hub's plan into this site's own bills.
 *
 * The one guarantee under test is `service_invoices.hub_item_key`: a sync that
 * runs every fifteen minutes forever must issue exactly one invoice per period.
 */
class HubPlanSyncTest extends TestCase
{
    use RefreshDatabase;

    private User $merchant;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.hub.enabled' => true,
            'services.hub.managed_plan' => true,
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

    private function service(string $code, int $sellingPrice): Service
    {
        return Service::factory()->create([
            'code' => $code,
            'name' => ucfirst($code),
            'selling_price' => $sellingPrice,
            'duration_days' => 365,
        ]);
    }

    /** @param list<array<string, mixed>> $rows */
    private function fakePlan(array $rows): void
    {
        Http::preventStrayRequests();
        Http::fake([
            'hub.test/api/v1/sites/plan' => Http::response([
                'status' => 'success', 'code' => 200, 'message' => 'ok', 'data' => $rows,
            ]),
        ]);
    }

    /** @param array<string, mixed> $overrides */
    private function period(array $overrides = []): array
    {
        return [
            'item_key' => '01ABC:1',
            'plan_uid' => '01ABC',
            'period_index' => 1,
            'service_code' => 'domain',
            'service_name' => 'Domain',
            'amount' => 180000,
            'duration_days' => 365,
            'period_starts_at' => now()->addDays(10)->toIso8601String(),
            'period_ends_at' => now()->addDays(375)->toIso8601String(),
            'due_at' => now()->addDays(10)->toIso8601String(),
            'billing_mode' => 'billed',
            'governs_licence' => false,
            'is_active' => true,
            ...$overrides,
        ];
    }

    private function sync(): array
    {
        return app(ApplyHubPlanAction::class)->execute();
    }

    public function test_running_twice_issues_exactly_one_invoice(): void
    {
        $this->service('domain', 250000);
        $this->fakePlan([$this->period()]);

        $this->assertSame(1, $this->sync()['issued']);
        $this->sync();
        $this->sync();

        $this->assertSame(1, ServiceInvoice::count());
        $this->assertSame('01ABC:1', ServiceInvoice::firstOrFail()->hub_item_key);
    }

    public function test_the_invoice_carries_the_hubs_negotiated_price_not_the_local_catalog_price(): void
    {
        // The catalog says 250.000; this client negotiated 180.000. Billing from
        // the local catalog would quietly charge every negotiated client the list
        // price, on every renewal, forever.
        $this->service('domain', 250000);
        $this->fakePlan([$this->period(['amount' => 180000])]);

        $this->sync();

        $invoice = ServiceInvoice::firstOrFail();
        $this->assertSame(180000, (int) $invoice->amount);
        $this->assertSame('hub_plan', $invoice->source);
        $this->assertSame(ServiceInvoiceStatus::UNPAID, $invoice->status);
    }

    public function test_a_prepaid_period_is_recorded_as_paid_without_touching_any_ledger(): void
    {
        $this->service('domain', 250000);
        $startedAt = now()->subMonths(2);

        $this->fakePlan([$this->period([
            'billing_mode' => 'prepaid',
            'amount' => 150000,
            'period_starts_at' => $startedAt->toIso8601String(),
            'period_ends_at' => $startedAt->copy()->addDays(365)->toIso8601String(),
            'due_at' => null,
        ])]);

        $this->assertSame(1, $this->sync()['prepaid']);

        $invoice = ServiceInvoice::firstOrFail();
        $this->assertSame(ServiceInvoiceStatus::PAID, $invoice->status);
        $this->assertTrue((bool) $invoice->settled_offline);
        $this->assertSame(150000, (int) $invoice->amount);
        // Bucketed on when the money moved, not on when we recorded it — the
        // monthly service-revenue figure reads this column.
        $this->assertSame($startedAt->toDateString(), $invoice->verified_at->toDateString());

        $subscription = ServiceSubscription::firstOrFail();
        $this->assertSame(SubscriptionStatus::ACTIVE, $subscription->status);
        // The operator's dates, not a stack on MAX(ends_at).
        $this->assertSame($startedAt->toDateString(), $subscription->starts_at->toDateString());
        $this->assertSame('hub', $subscription->source);

        // THE POINT: this money never entered the sub-merchant. Crediting
        // platform_ledger would authorise withdrawing cash that is not there and
        // manufacture a gap on the Hub's reconciliation page.
        $this->assertSame(0, PlatformMutation::where('type', 'service_revenue')->count());
    }

    public function test_a_prepaid_website_period_writes_no_subscription_row(): void
    {
        $this->service('website', 1500000);

        $this->fakePlan([$this->period([
            'item_key' => '01WEB:0',
            'plan_uid' => '01WEB',
            'period_index' => 0,
            'service_code' => 'website',
            'service_name' => 'Langganan Website',
            'billing_mode' => 'prepaid',
            'governs_licence' => true,
            'period_starts_at' => now()->subMonth()->toIso8601String(),
            'period_ends_at' => now()->addMonths(11)->toIso8601String(),
            'due_at' => null,
        ])]);

        $this->sync();

        $this->assertSame(1, ServiceInvoice::count());
        // That row belongs to ApplyHubLicenceAction, which mirrors the Hub's own
        // term in place. Two writers would double-count against the MAX(ends_at)
        // every reader uses.
        $this->assertSame(0, ServiceSubscription::count());
    }

    public function test_it_never_issues_a_second_open_bill_for_a_service(): void
    {
        $service = $this->service('domain', 250000);

        ServiceInvoice::create([
            'invoice_number' => 'SINV-LOCAL-1',
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'service_name' => 'Domain',
            'amount' => 250000,
            'duration_days' => 365,
            'status' => ServiceInvoiceStatus::UNPAID,
            'due_at' => now()->addDays(3),
        ]);

        $this->fakePlan([$this->period()]);

        // The client is already looking at a bill for this. Two invoices for one
        // thing, with no way to tell which to pay, is worse than a late renewal.
        $this->assertSame(1, $this->sync()['skipped']);
        $this->assertSame(1, ServiceInvoice::count());
    }

    public function test_a_period_for_a_service_the_catalog_has_not_synced_yet_is_skipped(): void
    {
        $this->fakePlan([$this->period()]);

        $this->assertSame(1, $this->sync()['skipped']);
        $this->assertSame(0, ServiceInvoice::count());
    }

    public function test_a_site_with_no_default_merchant_stops_quietly(): void
    {
        $this->merchant->delete();
        $this->service('domain', 250000);
        $this->fakePlan([$this->period()]);

        // A half-provisioned site must not fail the command it shares with other
        // work; the next sync finishes the job.
        $this->assertSame(0, $this->sync()['issued']);
        $this->assertSame(0, ServiceInvoice::count());
    }
}
