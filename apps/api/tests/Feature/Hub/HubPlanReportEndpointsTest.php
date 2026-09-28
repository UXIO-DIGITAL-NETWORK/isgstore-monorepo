<?php

declare(strict_types=1);

namespace Tests\Feature\Hub;

use App\Enums\ServiceInvoiceStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceInvoice;
use App\Models\ServiceSubscription;
use App\Models\User;
use App\Services\Payment\MonetapayService;
use App\Services\UxiolabsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The two endpoints the Hub added to the reporting contract: what this site's
 * owner actually holds, and a LIVE sub-merchant balance.
 */
class HubPlanReportEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private string $key = 'hub_live_testkey';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.hub.enabled' => true,
            'services.hub.api_key' => $this->key,
            'services.hub.allowed_ips' => '',
        ]);
    }

    private function pull(string $uri)
    {
        return $this->getJson($uri, ['X-Hub-Key' => $this->key]);
    }

    public function test_subscriptions_needs_the_hub_key(): void
    {
        $this->getJson('/api/v1/hub/subscriptions')->assertStatus(403);
        $this->getJson('/api/v1/hub/gateway-balance')->assertStatus(403);
        $this->getJson('/api/v1/hub/supplier-balance')->assertStatus(403);
    }

    public function test_subscriptions_collapses_to_one_row_per_service_at_the_furthest_end_date(): void
    {
        $merchant = User::factory()->create([
            'role_id' => Role::firstOrCreate(['name' => 'Payment-Admin'])->id,
        ]);
        $service = Service::factory()->create(['code' => 'domain', 'name' => 'Domain']);

        $invoice = ServiceInvoice::create([
            'invoice_number' => 'SINV-1',
            'merchant_id' => $merchant->id,
            'service_id' => $service->id,
            'hub_item_key' => '01ABC:1',
            'service_name' => 'Domain',
            'amount' => 180000,
            'duration_days' => 365,
            'status' => ServiceInvoiceStatus::PAID,
        ]);

        // Renewals stack as rows; the Hub's question is "does this site hold
        // service X today", so the furthest end date is the answer.
        ServiceSubscription::create([
            'merchant_id' => $merchant->id, 'service_id' => $service->id,
            'starts_at' => now()->subYear(), 'ends_at' => now(),
            'status' => SubscriptionStatus::ACTIVE,
        ]);
        ServiceSubscription::create([
            'merchant_id' => $merchant->id, 'service_id' => $service->id,
            'service_invoice_id' => $invoice->id,
            'starts_at' => now(), 'ends_at' => now()->addYear(),
            'status' => SubscriptionStatus::ACTIVE,
        ]);

        $rows = $this->pull('/api/v1/hub/subscriptions')->assertOk()->json('data');

        $this->assertCount(1, $rows);
        $this->assertSame('domain', $rows[0]['service_code']);
        $this->assertSame(now()->addYear()->toDateString(), substr($rows[0]['ends_at'], 0, 10));
        $this->assertSame('01ABC:1', $rows[0]['hub_item_key']);
        $this->assertSame(180000, $rows[0]['amount']);
    }

    public function test_a_live_balance_is_returned_and_warms_the_cache_the_summary_reads(): void
    {
        Http::preventStrayRequests();
        Http::fake(['*' => Http::response(['code' => 0, 'data' => ['current_balance' => '4250000']])]);

        $data = $this->pull('/api/v1/hub/gateway-balance')->assertOk()->json('data');

        $this->assertTrue($data['ok']);
        $this->assertSame(4250000, $data['balance']);

        // The SAME entry /summary reads: a Hub balance pull warms that figure
        // rather than leaving it stale beside a fresher one.
        $this->assertNotNull(Cache::get(app(MonetapayService::class)->balanceCacheKey()));
    }

    public function test_the_main_merchant_balance_is_read_separately_from_the_sub_merchant(): void
    {
        // Two different cache keys, so the test knows which reading is which.
        config(['services.monetapay.sub_mch_id' => 'SUB-123']);

        Http::preventStrayRequests();
        Http::fakeSequence()
            ->push(['code' => 0, 'data' => ['current_balance' => '4250000']])
            ->push(['code' => 0, 'data' => ['current_balance' => '777000']]);

        $data = $this->pull('/api/v1/hub/gateway-balance')->assertOk()->json('data');

        // First call = the site's sub-merchant, second = the parent account.
        $this->assertSame(4250000, $data['balance']);
        $this->assertSame(777000, $data['main_balance']);
        $this->assertNull($data['main_error']);

        // ...and the main reading warms its OWN entry, never the sub-merchant's.
        $this->assertNotSame(
            app(MonetapayService::class)->balanceCacheKey(),
            app(MonetapayService::class)->mainBalanceCacheKey(),
        );
        $this->assertNotNull(Cache::get(app(MonetapayService::class)->mainBalanceCacheKey()));
    }

    public function test_a_main_merchant_failure_does_not_fail_the_sub_merchant_reading(): void
    {
        // A distinct sub-merchant id, so the two readings do not share a cache
        // entry and the failure below is really the parent call's.
        config(['services.monetapay.sub_mch_id' => 'SUB-123']);

        Http::preventStrayRequests();
        Http::fakeSequence()
            ->push(['code' => 0, 'data' => ['current_balance' => '4250000']])
            ->push('boom', 500);

        $data = $this->pull('/api/v1/hub/gateway-balance')->assertOk()->json('data');

        // The sub-merchant figure stays good; only the parent account is unknown
        // — an unknown is not a zero, and it must not take the row down with it.
        $this->assertTrue($data['ok']);
        $this->assertSame(4250000, $data['balance']);
        $this->assertNull($data['main_balance']);
        $this->assertNotNull($data['main_error']);
    }

    public function test_a_gateway_failure_answers_200_with_ok_false(): void
    {
        Http::preventStrayRequests();
        Http::fake(['*' => Http::response('boom', 500)]);

        // Never a 5xx: reaching us and the gateway answering are different
        // facts, and a 5xx would make a gateway problem look like a site that
        // is down.
        $data = $this->pull('/api/v1/hub/gateway-balance')->assertOk()->json('data');

        $this->assertFalse($data['ok']);
        $this->assertNull($data['balance']);
    }

    public function test_a_live_supplier_balance_is_returned(): void
    {
        Http::preventStrayRequests();
        Http::fake(['*' => Http::response(['status' => true, 'data' => ['saldo' => '1500000']])]);

        $data = $this->pull('/api/v1/hub/supplier-balance')->assertOk()->json('data');

        $this->assertTrue($data['ok']);
        $this->assertSame(1500000, $data['balance']);
        $this->assertSame('Uxiotopup', $data['supplier']);
        $this->assertNotNull(Cache::get(UxiolabsService::BALANCE_CACHE_KEY));
    }

    public function test_a_supplier_failure_answers_200_with_ok_false(): void
    {
        Http::preventStrayRequests();
        Http::fake(['*' => Http::response('boom', 500)]);

        // Same rule as the gateway reading: reaching us and the supplier
        // answering are different facts, and a 5xx would make a supplier problem
        // look like a site that is down.
        $data = $this->pull('/api/v1/hub/supplier-balance')->assertOk()->json('data');

        $this->assertFalse($data['ok']);
        $this->assertNull($data['balance']);
        $this->assertNotNull($data['error']);
    }

    public function test_the_summary_still_never_calls_the_gateway(): void
    {
        Http::preventStrayRequests();
        Http::fake(['*' => Http::response(['code' => 0, 'data' => ['current_balance' => '1']])]);

        $this->pull('/api/v1/hub/summary')->assertOk();

        // Monetapay's inquiry timeout equals the Hub's pull timeout, so a live
        // call here hangs every mirror in the fleet.
        Http::assertNothingSent();
    }
}
