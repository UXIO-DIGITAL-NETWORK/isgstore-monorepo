<?php

declare(strict_types=1);

namespace Tests\Feature\Hub;

use App\Actions\Hub\ApplyHubPlanAction;
use App\Enums\ServiceInvoiceStatus;
use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceInvoice;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The trap that `hub_item_key` sets, and the two things that defuse it.
 *
 * `services:expire` used to sweep any UNPAID invoice past `due_at` into EXPIRED.
 * Against a unique billing key that is a one-way door: the period can never be
 * re-issued, so a client simply has no way to pay for a service they still hold,
 * and nothing anywhere reports a problem.
 */
class HubPlanExpiryTest extends TestCase
{
    use RefreshDatabase;

    private Service $service;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.hub.enabled' => true,
            'services.hub.managed_plan' => true,
            'services.hub.base_url' => 'https://hub.test',
            'services.hub.api_key' => 'hub_live_key',
        ]);

        User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Payment-Admin'])->id]);
        Setting::updateOrCreate(
            ['group' => 'payment', 'key' => 'website_service_code'],
            ['value' => 'website', 'type' => 'string'],
        );

        $this->service = Service::factory()->create([
            'code' => 'domain', 'name' => 'Domain', 'selling_price' => 250000, 'duration_days' => 365,
        ]);
    }

    private function fakePlan(?string $dueAt): void
    {
        Http::preventStrayRequests();
        Http::fake([
            'hub.test/api/v1/sites/plan' => Http::response([
                'status' => 'success', 'code' => 200, 'message' => 'ok', 'data' => [[
                    'item_key' => '01ABC:1',
                    'plan_uid' => '01ABC',
                    'period_index' => 1,
                    'service_code' => 'domain',
                    'service_name' => 'Domain',
                    'amount' => 180000,
                    'duration_days' => 365,
                    'period_starts_at' => now()->addDays(10)->toIso8601String(),
                    'period_ends_at' => now()->addDays(375)->toIso8601String(),
                    'due_at' => $dueAt,
                    'billing_mode' => 'billed',
                    'governs_licence' => false,
                    'is_active' => true,
                ]],
            ]),
        ]);
    }

    public function test_the_nightly_sweep_leaves_a_plan_bill_alone(): void
    {
        $this->fakePlan(now()->subDay()->toIso8601String());
        app(ApplyHubPlanAction::class)->execute();

        $this->artisan('services:expire')->assertSuccessful();

        // A bill kita issued on a schedule must not close itself. A bill a
        // CLIENT raised and abandoned still does — that behaviour is unchanged.
        $this->assertSame(ServiceInvoiceStatus::UNPAID, ServiceInvoice::firstOrFail()->status);
    }

    public function test_a_client_raised_bill_still_expires(): void
    {
        ServiceInvoice::create([
            'invoice_number' => 'SINV-LOCAL-1',
            'merchant_id' => User::firstOrFail()->id,
            'service_id' => $this->service->id,
            'service_name' => 'Domain',
            'amount' => 250000,
            'duration_days' => 365,
            'status' => ServiceInvoiceStatus::UNPAID,
            'due_at' => now()->subDay(),
        ]);

        $this->artisan('services:expire')->assertSuccessful();

        $this->assertSame(ServiceInvoiceStatus::EXPIRED, ServiceInvoice::firstOrFail()->status);
    }

    public function test_a_plan_bill_already_stranded_is_reopened_not_duplicated(): void
    {
        $this->fakePlan(now()->subDay()->toIso8601String());
        app(ApplyHubPlanAction::class)->execute();

        // Closed by a build that predates the exclusion above.
        ServiceInvoice::query()->update(['status' => ServiceInvoiceStatus::EXPIRED]);

        $report = app(ApplyHubPlanAction::class)->execute();

        $this->assertSame(1, $report['reopened']);
        $this->assertSame(1, ServiceInvoice::count());

        $invoice = ServiceInvoice::firstOrFail();
        $this->assertSame(ServiceInvoiceStatus::UNPAID, $invoice->status);
        $this->assertTrue($invoice->due_at->isFuture());
    }

    public function test_a_cancelled_plan_bill_is_left_as_it_is(): void
    {
        $this->fakePlan(now()->addDays(10)->toIso8601String());
        app(ApplyHubPlanAction::class)->execute();

        ServiceInvoice::query()->update(['status' => ServiceInvoiceStatus::CANCELLED]);

        app(ApplyHubPlanAction::class)->execute();

        // Somebody decided that. Reversing a decision is not a sync's business —
        // only the sweep's own collateral damage is healed.
        $this->assertSame(ServiceInvoiceStatus::CANCELLED, ServiceInvoice::firstOrFail()->status);
    }
}
