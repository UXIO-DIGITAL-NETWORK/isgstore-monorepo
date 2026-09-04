<?php

namespace Tests\Feature;

use App\Actions\Financial\GetPaymentGatewayBalancesAction;
use App\Actions\Financial\GetSupplierBalancesAction;
use App\Models\Supplier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The admin financial/integration panels used to hit the supplier and Monetapay
 * live on every request (and every 30s poll), with no timeout — a slow upstream
 * would hang the single-process dev server. Balances are now cached for a
 * minute; these tests pin that the upstream is called at most once within the
 * cache window.
 */
class BalanceCachingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        config(['services.uxiolabs.api_key' => 'test-api-key']);
    }

    public function test_supplier_balance_hits_uxiolabs_only_once_within_the_cache_window(): void
    {
        Supplier::factory()->create(['name' => 'Uxiolabs']);
        Http::fake(['*/saldo' => Http::response(['status' => true, 'msg' => 'berhasil', 'data' => ['saldo' => 500000]], 200)]);

        $action = app(GetSupplierBalancesAction::class);
        $first = $action->execute();
        $second = $action->execute(); // served from cache

        $this->assertSame(500000.0, $first[0]['balance']);
        $this->assertSame(500000.0, $second[0]['balance']);
        Http::assertSentCount(1);
    }

    public function test_gateway_balance_hits_monetapay_only_once_within_the_cache_window(): void
    {
        Http::fake(['*/v1.0.0/balance' => Http::response([
            'balanceInfos' => [['balanceType' => 'AVAILABLE', 'amount' => ['value' => '750000']]],
        ], 200)]);

        $action = app(GetPaymentGatewayBalancesAction::class);
        $action->execute();
        $action->execute(); // served from cache

        Http::assertSentCount(1);
    }

    public function test_a_failing_upstream_returns_a_null_balance_rather_than_erroring(): void
    {
        Supplier::factory()->create(['name' => 'Uxiolabs']);
        Http::fake(['*/saldo' => Http::response(['message' => 'error'], 500)]);

        $result = app(GetSupplierBalancesAction::class)->execute();

        $this->assertNull($result[0]['balance']);
    }
}
