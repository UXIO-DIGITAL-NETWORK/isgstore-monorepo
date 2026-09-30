<?php

declare(strict_types=1);

namespace Tests\Feature\Hub;

use App\Models\GatewayBalanceSnapshot;
use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceInvoice;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Withdrawal;
use App\Services\Payment\MonetapayService;
use App\Support\Finance\FinanceTotals;
use App\Support\Ledger\PlatformLedger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The site's reporting contract for the Hub. Two things are pinned here:
 * the gate (key + IP, dead-by-default) and the payload SHAPE — the contract is
 * additive-only, so a field disappearing from these assertions means a
 * breaking change that would corrupt the Hub's aggregation for every site
 * still on an older deploy.
 */
class HubReportEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private const KEY = 'hub_live_testkey123';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.hub.api_key' => self::KEY,
            'services.hub.allowed_ips' => '',
            'services.monetapay.token' => 'test-token',
        ]);
        // A Hub pull must never make a live gateway call; if any handler tried,
        // this fake keeps it on-machine and would surface as an unexpected send.
        Http::fake(['*' => Http::response(['code' => 0, 'data' => ['balance' => 123000]])]);
    }

    /** gateway_balance is read from the warm balance cache (never a live call). */
    private function warmGatewayBalance(int $balance): void
    {
        // Key and payload shape must be the ones the service really writes —
        // warming a shape of our own here would let a reader/writer mismatch
        // pass this test while the Hub reads nothing in production.
        Cache::put(
            app(MonetapayService::class)->balanceCacheKey(),
            ['code' => 0, 'data' => ['current_balance' => (string) $balance]],
            300,
        );
    }

    private function pull(string $path)
    {
        return $this->getJson($path, ['X-Hub-Key' => self::KEY]);
    }

    public function test_endpoints_are_dead_without_a_configured_key(): void
    {
        config(['services.hub.api_key' => null]);

        // Even presenting the "right" key fails when none is configured.
        $this->getJson('/api/v1/hub/summary', ['X-Hub-Key' => self::KEY])->assertStatus(403);
        $this->getJson('/api/v1/hub/summary')->assertStatus(403);
    }

    public function test_a_wrong_or_missing_key_is_rejected(): void
    {
        $this->getJson('/api/v1/hub/summary')->assertStatus(403);
        $this->getJson('/api/v1/hub/summary', ['X-Hub-Key' => 'wrong'])->assertStatus(403);
    }

    public function test_an_unlisted_source_ip_is_rejected_when_allowlist_set(): void
    {
        config(['services.hub.allowed_ips' => '10.9.9.9']);
        $this->pull('/api/v1/hub/summary')->assertStatus(403);

        // The test client reports 127.0.0.1 — listing it opens the gate.
        config(['services.hub.allowed_ips' => '10.9.9.9, 127.0.0.1']);
        $this->pull('/api/v1/hub/summary')->assertOk();
    }

    /**
     * /v1/hub/balances answers by OUR sales rules, not by the gateway: settled
     * sales only, minus the withdrawals that still hold money. The Hub mirrors
     * the sub-merchant's gateway figure separately — this is the other half, and
     * the one that says what the merchant may actually take.
     */
    public function test_balances_report_the_merchant_figure_by_settlement_rules(): void
    {
        config(['services.withdrawal.hold_buffer_days' => 1]);

        $merchant = User::factory()->create([
            'role_id' => Role::firstOrCreate(['name' => 'Payment-Admin'])->id,
        ]);

        // QRIS settles T+1; with the 1-day buffer a sale clears after 48h.
        $this->paidSale($merchant, 'qris', 100000, now()->subDays(3));
        $this->paidSale($merchant, 'qris', 40000, now()->subHour());

        $data = $this->pull('/api/v1/hub/balances')->assertOk()->json('data');

        $this->assertSame(100000, $data['merchant_available']);
        $this->assertSame(40000, $data['merchant_held']);
        $this->assertSame(140000, $data['sales_total']);
        $this->assertSame(0, $data['withdrawn_hold']);
        $this->assertSame(1, $data['hold_buffer_days']);
    }

    public function test_balances_are_unknown_rather_than_zero_without_a_merchant(): void
    {
        $data = $this->pull('/api/v1/hub/balances')->assertOk()->json('data');

        // No merchant yet: unknown, never a tidy zero the Hub would draw a
        // conclusion from.
        $this->assertNull($data['merchant_available']);
        $this->assertNull($data['merchant_held']);
        // The platform's own profit is still a real number.
        $this->assertSame(0, $data['platform_available']);
    }

    public function test_balances_requires_the_hub_key(): void
    {
        $this->getJson('/api/v1/hub/balances')->assertStatus(403);
    }

    /** A paid sale on the given channel, with its payment stamped paid at $paidAt. */
    private function paidSale(User $merchant, string $channelCode, int $amount, \DateTimeInterface $paidAt): void
    {
        $channel = PaymentChannel::firstOrCreate(
            ['channel_code' => $channelCode],
            PaymentChannel::factory()->make(['channel_code' => $channelCode])->getAttributes(),
        );

        $transaction = Transaction::factory()->create([
            'merchant_id' => $merchant->id,
            'payment_channel_id' => $channel->id,
            'amount_base' => $amount,
            'amount_fee' => 0,
            'amount_total' => $amount,
            'status' => 'PAID',
            'created_at' => $paidAt,
        ]);

        Payment::factory()->create([
            'transaction_id' => $transaction->id,
            'payment_channel_id' => $channel->id,
            'gross_amount' => $amount,
            'status' => '3',
            'paid_at' => $paidAt,
        ]);
    }

    /** One sale with the fee columns the finance breakdown reads. */
    private function saleWithFees(
        User $merchant,
        PaymentChannel $channel,
        int $base,
        int $adminFee,
        int $gatewayFee,
        int $tax,
        string $status,
    ): void {
        $transaction = Transaction::factory()->create([
            'merchant_id' => $merchant->id,
            'payment_channel_id' => $channel->id,
            'amount_base' => $base,
            'amount_fee' => $adminFee,
            'amount_total' => $base + $adminFee,
            'status' => $status,
        ]);

        Payment::factory()->create([
            'transaction_id' => $transaction->id,
            'payment_channel_id' => $channel->id,
            'gross_amount' => $base + $adminFee,
            'gateway_fee' => $gatewayFee,
            'tax_amount' => $tax,
            'status' => '3',
        ]);
    }

    public function test_summary_shape_is_pinned(): void
    {
        PlatformLedger::record(amount: 50000, type: 'markup', reference: 'SEED-1');
        $this->warmGatewayBalance(123000);

        $this->pull('/api/v1/hub/summary')
            ->assertOk()
            ->assertJsonPath('data.profit_total', 50000)
            ->assertJsonPath('data.platform_available', 50000)
            ->assertJsonPath('data.gateway_balance', 123000)
            ->assertJsonStructure(['data' => [
                'generated_at', 'profit_total', 'platform_available',
                'pending_withdrawals_count', 'pending_withdrawals_amount',
                'oldest_pending_minutes', 'active_subscriptions_count',
                'paid_service_invoices_this_month', 'gateway_balance',
                // Finance breakdown (Phase 1) — same numbers the payment-internal
                // dashboard shows, so the Hub can render those cards.
                'total_admin_fee', 'total_gateway_fee', 'total_tax',
                'total_settled_to_merchants', 'total_transactions_count',
                'total_transactions_amount',
                // This site's OWN yearly licence, so the Hub can chase the
                // renewal before the deployment lapses.
                'website_subscription' => ['status', 'ends_at', 'days_remaining', 'checkout_url'],
            ]]);
    }

    public function test_summary_reports_the_sites_own_licence_without_billing_configured(): void
    {
        // No default merchant and no website service in this test's fixtures —
        // the pull must still answer 200. A summary that throws because billing
        // is unwired takes the Hub's whole view of the site down with it.
        $this->pull('/api/v1/hub/summary')
            ->assertOk()
            ->assertJsonPath('data.website_subscription.status', 'unconfigured')
            ->assertJsonPath('data.website_subscription.ends_at', null);
    }

    public function test_summary_never_makes_a_live_gateway_call(): void
    {
        // No warm cache, no snapshot: the pull must still return fast with a null
        // balance — it must NEVER reach out to the gateway (that is what hung the
        // pull past the Hub's timeout in production).
        $this->pull('/api/v1/hub/summary')
            ->assertOk()
            ->assertJsonPath('data.gateway_balance', null);

        Http::assertNothingSent();
    }

    public function test_summary_falls_back_to_the_latest_reconciliation_snapshot(): void
    {
        GatewayBalanceSnapshot::create([
            'captured_at' => now(),
            'reported_balance' => 777000,
            'expected_balance' => 777000,
            'delta' => 0,
        ]);

        $this->pull('/api/v1/hub/summary')
            ->assertOk()
            ->assertJsonPath('data.gateway_balance', 777000);

        Http::assertNothingSent();
    }

    /**
     * The finance breakdown the Hub renders is the site dashboard's own numbers.
     *
     * Two paid sales and one pending one: only paid rows may feed the fee
     * totals, while the count is the whole book of merchant transactions —
     * exactly how the dashboard has always read it.
     */
    public function test_summary_reports_the_finance_breakdown_the_dashboard_shows(): void
    {
        $channel = PaymentChannel::factory()->create(['channel_code' => 'qris']);
        $merchant = User::factory()->create([
            'role_id' => Role::firstOrCreate(['name' => 'Payment-Admin'])->id,
        ]);

        $this->saleWithFees($merchant, $channel, 100000, 2500, 700, 770, 'PAID');
        $this->saleWithFees($merchant, $channel, 40000, 1000, 280, 308, 'PAID');
        // Must not reach any total but the count.
        $this->saleWithFees($merchant, $channel, 999999, 99999, 99999, 99999, 'PENDING');

        $data = $this->pull('/api/v1/hub/summary')->assertOk()->json('data');

        $this->assertSame(3500, $data['total_admin_fee']);
        $this->assertSame(980, $data['total_gateway_fee']);
        $this->assertSame(1078, $data['total_tax']);
        $this->assertSame(140000, $data['total_settled_to_merchants']);
        $this->assertSame(3, $data['total_transactions_count']);
        $this->assertSame(140000, $data['total_transactions_amount']);
    }

    /**
     * The finance breakdown must stay THREE queries, whatever it grows to return.
     *
     * The cost is pinned, separately from the payload shape, because this is the
     * block that took the site past the Hub's 15s pull timeout: it ran six
     * full-history aggregates per pull — two of them an IN list of every paid
     * transaction id that MySQL materialises before probing `payments` — on an
     * endpoint the Hub calls every minute. The symptom was silent and one-sided:
     * `cURL error 28 ... 0 bytes received` on the Hub, nothing in the site's log.
     *
     * A count of queries is only a proxy for that cost, but it is the part that
     * can be pinned without a dataset: a fourth aggregate, or the IN list coming
     * back, fails here rather than in production a few hundred thousand sales later.
     */
    public function test_the_finance_breakdown_costs_three_queries(): void
    {
        $queries = 0;
        DB::listen(function () use (&$queries): void {
            $queries++;
        });

        FinanceTotals::snapshot();

        $this->assertLessThanOrEqual(3, $queries, "the finance breakdown issued {$queries} queries");
    }

    public function test_withdrawals_lists_open_rows_with_type_discriminator(): void
    {
        $role = Role::firstOrCreate(['name' => 'Payment-Admin']);
        $merchant = User::factory()->create(['role_id' => $role->id]);

        Withdrawal::create([
            'merchant_id' => $merchant->id,
            'withdrawal_number' => 'WD-merchant1',
            'amount' => 50000, 'fee' => 1665, 'nett' => 48335,
            'bank_code' => 'BCA', 'account_name' => 'Toko', 'status' => 'PENDING',
        ]);
        Withdrawal::create([
            'merchant_id' => null,
            'requested_by' => $merchant->id,
            'withdrawal_number' => 'WD-internal1',
            'amount' => 30000, 'fee' => 1665, 'nett' => 28335,
            'bank_code' => 'BCA', 'account_name' => 'Kas', 'status' => 'PENDING',
        ]);

        $rows = $this->pull('/api/v1/hub/withdrawals')->assertOk()->json('data');

        $this->assertCount(2, $rows);
        $byNumber = collect($rows)->keyBy('withdrawal_number');
        $this->assertSame('merchant', $byNumber['WD-merchant1']['type']);
        $this->assertSame('internal', $byNumber['WD-internal1']['type']);
        $this->assertSame($merchant->name, $byNumber['WD-merchant1']['merchant_name']);
        $this->assertNull($byNumber['WD-internal1']['merchant_name']);
        $this->assertArrayHasKey('age_minutes', $byNumber['WD-merchant1']);
    }

    public function test_profit_groups_by_date_and_type(): void
    {
        PlatformLedger::record(amount: 10000, type: 'markup', reference: 'A');
        PlatformLedger::record(amount: 5000, type: 'markup', reference: 'B');
        PlatformLedger::record(amount: 1665, type: 'withdrawal_fee', reference: 'C');

        $rows = $this->pull('/api/v1/hub/profit?days=7')->assertOk()->json('data');

        $byType = collect($rows)->keyBy('type');
        $this->assertSame(15000, $byType['markup']['total']);
        $this->assertSame(1665, $byType['withdrawal_fee']['total']);
        $this->assertSame(now()->toDateString(), $byType['markup']['date']);
    }

    public function test_channels_exposes_the_fee_schedule(): void
    {
        PaymentChannel::factory()->create([
            'channel_code' => 'qris',
            'payment_type' => 'qris',
            'fee_flat' => 0, 'fee_percent' => 0.8,
            'gateway_fee_flat' => 0, 'gateway_fee_percent' => 0.7,
            'tax_percent' => 11,
        ]);

        $rows = $this->pull('/api/v1/hub/channels')->assertOk()->json('data');
        $qris = collect($rows)->firstWhere('channel_code', 'qris');

        $this->assertSame(0.8, $qris['fee_percent']);
        $this->assertSame(0.7, $qris['gateway_fee_percent']);
        $this->assertTrue($qris['is_active']);
    }

    public function test_service_orders_lists_recent_invoices(): void
    {
        $role = Role::firstOrCreate(['name' => 'Payment-Admin']);
        $merchant = User::factory()->create(['role_id' => $role->id, 'name' => 'Klien A']);
        $service = Service::create([
            'code' => 'uxiolabs', 'name' => 'Uxiolabs', 'category' => 'supplier',
            'selling_price' => 250000, 'duration_days' => 30,
        ]);
        ServiceInvoice::create([
            'invoice_number' => 'SINV-202608-TEST01',
            'merchant_id' => $merchant->id,
            'service_id' => $service->id,
            'service_name' => 'Uxiolabs',
            'amount' => 250000, 'duration_days' => 30, 'status' => 'UNPAID',
        ]);

        $rows = $this->pull('/api/v1/hub/service-orders')->assertOk()->json('data');

        $this->assertCount(1, $rows);
        $this->assertSame('SINV-202608-TEST01', $rows[0]['invoice_number']);
        $this->assertSame('uxiolabs', $rows[0]['service_code']);
        $this->assertSame('Klien A', $rows[0]['merchant_name']);
        $this->assertSame('UNPAID', $rows[0]['status']);
    }
}
