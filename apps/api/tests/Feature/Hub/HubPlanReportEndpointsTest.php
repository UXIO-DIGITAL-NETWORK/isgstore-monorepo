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
        $this->assertNotNull(Cache::get(MonetapayService::balanceCacheKey()));
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
