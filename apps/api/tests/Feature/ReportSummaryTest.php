<?php

namespace Tests\Feature;

use App\Models\PaymentChannel;
use App\Models\Product;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportSummaryTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(string $timezone = 'UTC'): User
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        $admin = User::factory()->create(['role_id' => $role->id, 'timezone' => $timezone]);
        Sanctum::actingAs($admin, ['access-api']);

        return $admin;
    }

    public function test_summary_requires_admin(): void
    {
        $this->getJson('/api/v1/reports/summary')->assertUnauthorized();
    }

    public function test_summary_aggregates_completed_revenue_transactions_and_profit(): void
    {
        $this->actingAsAdmin();
        $product = Product::factory()->create(['name' => 'Free Fire 100 Diamonds']);
        Transaction::factory()->count(3)->create([
            'product_id' => $product->id,
            'status' => 'COMPLETED',
            'amount_total' => 10000,
            'margin' => 1500,
        ]);
        Transaction::factory()->create(['status' => 'PENDING', 'amount_total' => 99999, 'margin' => 9999]);

        $this->getJson('/api/v1/reports/summary?period=daily')
            ->assertOk()
            ->assertJsonPath('data.total_revenue', 30000)
            ->assertJsonPath('data.total_transactions', 3)
            ->assertJsonPath('data.total_profit', 4500)
            ->assertJsonPath('data.breakdown.0.label', 'Free Fire 100 Diamonds')
            ->assertJsonPath('data.breakdown.0.profit', 4500);
    }

    /**
     * The test that proves the whole feature: an order placed at 01:00 WIB
     * belongs to that WIB day, not to the previous UTC one. Before the period
     * resolver this transaction was invisible in "today"'s report for every
     * Jakarta admin between midnight and 07:00 local.
     */
    public function test_daily_window_follows_the_admin_timezone_not_utc(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-02T03:00:00Z')); // 10:00 WIB, 2 Sep
        $this->actingAsAdmin('Asia/Jakarta');

        $product = Product::factory()->create(['name' => 'Mobile Legends 86 Diamonds']);
        // 2026-09-01T18:00Z == 2026-09-02T01:00 WIB — the same local day as "now".
        Transaction::factory()->create([
            'product_id' => $product->id,
            'status' => 'COMPLETED',
            'amount_total' => 25000,
            'margin' => 3000,
            'created_at' => Carbon::parse('2026-09-01T18:00:00Z'),
        ]);
        // 2026-09-01T10:00Z == 2026-09-01T17:00 WIB — the previous local day.
        Transaction::factory()->create([
            'product_id' => $product->id,
            'status' => 'COMPLETED',
            'amount_total' => 77000,
            'margin' => 7000,
            'created_at' => Carbon::parse('2026-09-01T10:00:00Z'),
        ]);

        $this->getJson('/api/v1/reports/summary?period=daily')
            ->assertOk()
            ->assertJsonPath('data.timezone', 'Asia/Jakarta')
            ->assertJsonPath('data.total_revenue', 25000)
            ->assertJsonPath('data.total_transactions', 1)
            ->assertJsonPath('data.start_at', '2026-09-01T17:00:00Z');
    }

    public function test_channel_breakdown_labels_balance_payments_and_reconciles_with_the_total(): void
    {
        $this->actingAsAdmin();
        $channel = PaymentChannel::factory()->create(['name' => 'QRIS']);

        Transaction::factory()->create([
            'status' => 'COMPLETED', 'amount_total' => 10000, 'margin' => 1000,
            'payment_channel_id' => $channel->id,
        ]);
        Transaction::factory()->create([
            'status' => 'COMPLETED', 'amount_total' => 5000, 'margin' => 500,
            'payment_channel_id' => null,
        ]);

        $response = $this->getJson('/api/v1/reports/summary?period=daily')->assertOk();

        $channels = $response->json('data.channel_breakdown');
        $labels = array_column($channels, 'label');
        $this->assertContains('QRIS', $labels);
        $this->assertContains('Balance', $labels);
        // Rows must always add up to the header they sit under.
        $this->assertSame($response->json('data.total_revenue'), array_sum(array_column($channels, 'revenue')));
    }

    public function test_custom_period_requires_both_dates(): void
    {
        $this->actingAsAdmin();

        $this->getJson('/api/v1/reports/summary?period=custom')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['date_from', 'date_to']);
    }

    public function test_unknown_period_is_rejected_instead_of_silently_becoming_daily(): void
    {
        $this->actingAsAdmin();

        $this->getJson('/api/v1/reports/summary?period=weekly')
            ->assertStatus(422)
            ->assertJsonValidationErrors('period');
    }

    public function test_iso_datetimes_are_rejected_so_only_calendar_days_are_accepted(): void
    {
        $this->actingAsAdmin();

        $this->getJson('/api/v1/reports/summary?period=custom&date_from=2026-09-02T17:00:00.000Z&date_to=2026-09-03')
            ->assertStatus(422)
            ->assertJsonValidationErrors('date_from');
    }

    public function test_inverted_and_oversized_custom_ranges_are_rejected(): void
    {
        $this->actingAsAdmin();

        $this->getJson('/api/v1/reports/summary?period=custom&date_from=2026-09-05&date_to=2026-09-01')
            ->assertStatus(422)
            ->assertJsonValidationErrors('date_to');

        $this->getJson('/api/v1/reports/summary?period=custom&date_from=2024-01-01&date_to=2026-01-01')
            ->assertStatus(422)
            ->assertJsonValidationErrors('date_to');
    }

    public function test_custom_range_returns_only_transactions_inside_it(): void
    {
        $this->actingAsAdmin('Asia/Jakarta');
        $product = Product::factory()->create(['name' => 'Genshin 60 Crystals']);

        foreach (['2026-08-31T20:00:00Z', '2026-09-02T05:00:00Z', '2026-09-10T05:00:00Z'] as $at) {
            Transaction::factory()->create([
                'product_id' => $product->id, 'status' => 'COMPLETED',
                'amount_total' => 10000, 'margin' => 1000,
                'created_at' => Carbon::parse($at),
            ]);
        }

        // 1–3 Sep WIB spans 2026-08-31T17:00Z .. 2026-09-03T17:00Z, so the
        // first two rows are in and the 10 Sep one is out.
        $this->getJson('/api/v1/reports/summary?period=custom&date_from=2026-09-01&date_to=2026-09-03')
            ->assertOk()
            ->assertJsonPath('data.period', 'custom')
            ->assertJsonPath('data.total_transactions', 2)
            ->assertJsonPath('data.total_revenue', 20000);
    }
}
