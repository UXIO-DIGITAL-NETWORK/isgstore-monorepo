<?php

declare(strict_types=1);

namespace Tests\Feature\Hub;

use App\Actions\Hub\ApplyHubPlanAction;
use App\Actions\Service\ActivateServiceSubscriptionAction;
use App\Enums\ServiceInvoiceStatus;
use App\Jobs\PushLicenceRenewalJob;
use App\Models\HubPlanItem;
use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceInstallation;
use App\Models\ServiceInvoice;
use App\Models\ServiceSubscription;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * A one-time setup fee is a bill, not a subscription.
 *
 * The Hub publishes exactly one period for it (`SiteServicePlanPeriods`), and
 * this site must then treat paying it differently from a renewal: settle the
 * bill and stop. Opening a subscription would hand the client a period nobody
 * billed for, and extending the licence from a setup fee would light the site
 * without a term behind it.
 */
class OneTimeSetupFeeTest extends TestCase
{
    use RefreshDatabase;

    private User $merchant;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.hub.enabled' => true,
            'services.hub.managed_plan' => true,
            'services.hub.managed_licence' => true,
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

    private function service(string $code, int $price = 500000): Service
    {
        return Service::factory()->create([
            'code' => $code,
            'name' => ucfirst($code),
            'selling_price' => $price,
            'duration_days' => 365,
        ]);
    }

    /** @param array<string, mixed> $overrides */
    private function period(array $overrides = []): array
    {
        return [
            'item_key' => '01SETUP:0',
            'plan_uid' => '01SETUP',
            'period_index' => 0,
            'service_code' => 'setup',
            'service_name' => 'Biaya Setup',
            'amount' => 500000,
            'duration_days' => 365,
            'period_starts_at' => now()->toIso8601String(),
            'period_ends_at' => now()->addDays(365)->toIso8601String(),
            'due_at' => now()->toIso8601String(),
            'billing_mode' => 'one_time',
            'governs_licence' => false,
            'is_active' => true,
            ...$overrides,
        ];
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

    public function test_a_one_time_fee_issues_one_bill_and_never_a_second(): void
    {
        $this->service('setup');
        $this->fakePlan([$this->period()]);

        $this->assertSame(1, app(ApplyHubPlanAction::class)->execute()['issued']);
        app(ApplyHubPlanAction::class)->execute();
        app(ApplyHubPlanAction::class)->execute();

        $invoice = ServiceInvoice::firstOrFail();
        $this->assertSame('one_time', $invoice->billing_mode);
        $this->assertSame(ServiceInvoiceStatus::UNPAID, $invoice->status);
        // The whole point of the unique key, for a fee that has exactly one period.
        $this->assertSame(1, ServiceInvoice::count());
    }

    public function test_each_mode_is_carried_onto_its_bill(): void
    {
        $this->service('setup');
        $this->service('domain');

        $this->fakePlan([
            $this->period(),
            $this->period([
                'item_key' => '01DOM:1',
                'plan_uid' => '01DOM',
                'period_index' => 1,
                'service_code' => 'domain',
                'service_name' => 'Domain',
                'billing_mode' => 'billed',
            ]),
        ]);

        app(ApplyHubPlanAction::class)->execute();

        $this->assertSame(
            'one_time',
            ServiceInvoice::where('hub_item_key', '01SETUP:0')->firstOrFail()->billing_mode,
        );
        $this->assertSame(
            'billed',
            ServiceInvoice::where('hub_item_key', '01DOM:1')->firstOrFail()->billing_mode,
        );
    }

    public function test_paying_a_one_time_fee_opens_no_subscription(): void
    {
        $service = $this->service('setup');
        $invoice = ServiceInvoice::create([
            'invoice_number' => 'SINV-SETUP-1',
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'service_name' => 'Biaya Setup',
            'amount' => 500000,
            'duration_days' => 365,
            'status' => ServiceInvoiceStatus::PAID,
            'verified_at' => now(),
            'source' => 'hub_plan',
            'billing_mode' => 'one_time',
        ]);

        $subscription = app(ActivateServiceSubscriptionAction::class)->execute($invoice);

        $this->assertNull($subscription);
        // No window, and no installation hanging off a window that never opened.
        $this->assertSame(0, ServiceSubscription::count());
        $this->assertSame(0, ServiceInstallation::count());
    }

    public function test_a_one_time_fee_never_extends_the_licence(): void
    {
        Queue::fake();

        $service = $this->service('website');
        $invoice = ServiceInvoice::create([
            'invoice_number' => 'SINV-SETUP-2',
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'service_name' => 'Biaya Setup',
            'amount' => 500000,
            'duration_days' => 365,
            'status' => ServiceInvoiceStatus::PAID,
            'source' => 'hub_plan',
            'billing_mode' => 'one_time',
        ]);

        PushLicenceRenewalJob::maybeDispatch($invoice);

        // Even on the website service itself: a setup fee is not a term.
        Queue::assertNotPushed(PushLicenceRenewalJob::class);
    }

    /**
     * The one-time LICENCE is reported from the PAYMENT path, not only from the
     * job's own gate.
     *
     * This is the bug the whole flow died on: a one-time invoice buys no
     * subscription window, so this action returned early and never told the Hub
     * anything — and a client who had paid for their site in full kept looking at
     * a storefront that stayed dark, with nothing anywhere reporting a problem.
     */
    public function test_paying_a_one_time_licence_reports_it_from_the_payment_path(): void
    {
        Queue::fake();

        $this->service('website');

        HubPlanItem::create([
            'item_key' => '01LIC:0',
            'plan_uid' => '01LIC',
            'period_index' => 0,
            'service_code' => 'website',
            'service_name' => 'Lisensi Situs',
            'amount' => 12000000,
            'duration_days' => 365,
            'billing_mode' => 'one_time',
            'governs_licence' => true,
            'period_starts_at' => now(),
            'period_ends_at' => now()->addDays(365),
            'due_at' => now(),
            'is_active' => true,
            'synced_at' => now(),
        ]);

        $invoice = ServiceInvoice::create([
            'invoice_number' => 'SINV-LIC-1',
            'merchant_id' => $this->merchant->id,
            'service_id' => Service::where('code', 'website')->firstOrFail()->id,
            'service_name' => 'Lisensi Situs',
            'amount' => 12000000,
            'duration_days' => 365,
            'status' => ServiceInvoiceStatus::PAID,
            'verified_at' => now(),
            'source' => 'hub_plan',
            'billing_mode' => 'one_time',
            'hub_item_key' => '01LIC:0',
        ]);

        app(ActivateServiceSubscriptionAction::class)->execute($invoice);

        Queue::assertPushed(PushLicenceRenewalJob::class);
    }

    public function test_the_governing_plan_line_renews_the_licence_on_its_own_service(): void
    {
        Queue::fake();

        // The Hub marks exactly one line "menentukan masa aktif situs", and the
        // site obeys that flag — not just the website service code. (The Hub now
        // refuses to set the flag on anything else, so this is the belt to that
        // brace: a legacy row still renews what it says it governs.)
        $service = $this->service('hosting');
        HubPlanItem::create([
            'item_key' => '01HOST:0',
            'plan_uid' => '01HOST',
            'period_index' => 0,
            'service_code' => 'hosting',
            'service_name' => 'Hosting',
            'amount' => 300000,
            'duration_days' => 365,
            'billing_mode' => 'billed',
            'governs_licence' => true,
            'period_starts_at' => now(),
            'period_ends_at' => now()->addDays(365),
            'due_at' => now(),
            'is_active' => true,
            'synced_at' => now(),
        ]);

        $invoice = ServiceInvoice::create([
            'invoice_number' => 'SINV-HOST-1',
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'service_name' => 'Hosting',
            'amount' => 300000,
            'duration_days' => 365,
            'status' => ServiceInvoiceStatus::PAID,
            'source' => 'hub_plan',
            'billing_mode' => 'billed',
            'hub_item_key' => '01HOST:0',
        ]);

        PushLicenceRenewalJob::maybeDispatch($invoice);

        Queue::assertPushed(PushLicenceRenewalJob::class);
    }

    public function test_an_ordinary_service_bill_still_does_not_renew_the_licence(): void
    {
        Queue::fake();

        $service = $this->service('domain');
        $invoice = ServiceInvoice::create([
            'invoice_number' => 'SINV-DOM-1',
            'merchant_id' => $this->merchant->id,
            'service_id' => $service->id,
            'service_name' => 'Domain',
            'amount' => 180000,
            'duration_days' => 365,
            'status' => ServiceInvoiceStatus::PAID,
            'source' => 'hub_plan',
            'billing_mode' => 'billed',
            'hub_item_key' => '01DOM:1',
        ]);

        PushLicenceRenewalJob::maybeDispatch($invoice);

        Queue::assertNotPushed(PushLicenceRenewalJob::class);
    }
}
