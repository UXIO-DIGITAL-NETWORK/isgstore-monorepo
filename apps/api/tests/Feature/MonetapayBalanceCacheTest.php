<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\Payment\MonetapayService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The balance cache must be keyed per (sub-merchant, currency). With per-client
 * sub-merchants, a fixed key would hand every caller the FIRST queried
 * sub-merchant's balance for the next 60s — no error, just a plausible wrong
 * number, which would silently corrupt the Hub's reconciliation view.
 */
class MonetapayBalanceCacheTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.monetapay.token' => 'test-token',
            'services.monetapay.mch_id' => 'MCH-1',
        ]);
        Cache::flush();
    }

    public function test_each_sub_merchant_gets_its_own_cache_entry(): void
    {
        $calls = 0;
        Http::fake(function () use (&$calls) {
            $calls++;

            return Http::response(['code' => 0, 'data' => ['balance' => $calls * 1000]]);
        });

        $service = app(MonetapayService::class);

        $main = $service->inquiryBalanceCached();
        $subA = $service->inquiryBalanceCached('SUB-A');
        $subB = $service->inquiryBalanceCached('SUB-B');

        // Three distinct queries — three live calls, three distinct results.
        $this->assertSame(3, $calls);
        $this->assertNotEquals($main, $subA);
        $this->assertNotEquals($subA, $subB);

        // Re-reading each returns its own cached copy without a new live call.
        $this->assertSame($subA, $service->inquiryBalanceCached('SUB-A'));
        $this->assertSame($main, $service->inquiryBalanceCached());
        $this->assertSame(3, $calls);
    }

    public function test_balance_cache_key_is_shared_with_cache_busting_callers(): void
    {
        Http::fake(fn () => Http::response(['code' => 0, 'data' => ['balance' => 5000]]));

        $service = app(MonetapayService::class);
        $service->inquiryBalanceCached('SUB-A');

        // The public key helper points at the same entry the service wrote —
        // this is what PingIntegrationChannelAction relies on to force-refresh.
        $this->assertTrue(Cache::has(MonetapayService::balanceCacheKey('SUB-A')));

        Cache::forget(MonetapayService::balanceCacheKey('SUB-A'));
        $this->assertFalse(Cache::has(MonetapayService::balanceCacheKey('SUB-A')));
    }
}
