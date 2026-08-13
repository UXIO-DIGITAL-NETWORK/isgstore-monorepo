<?php

namespace Tests\Feature\PaymentPage;

use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\Product;
use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceInvoice;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The Transaksi feed merges two tables whose ids overlap and whose money flows
 * in opposite directions. Both facts are easy to get silently wrong.
 */
class UnifiedTransactionListTest extends TestCase
{
    use RefreshDatabase;

    private function merchant(): User
    {
        return User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Payment-Admin'])->id]);
    }

    private function internal(): User
    {
        return User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Payment-Internal'])->id]);
    }

    private function sale(User $merchant, array $over = []): Transaction
    {
        $product = Product::factory()->create(['name' => 'Diamond 100']);
        $channel = PaymentChannel::factory()->create(['name' => 'QRIS']);

        return Transaction::create(array_merge([
            'transaction_type' => 'prepaid',
            'invoice_number' => 'INV-'.fake()->unique()->numerify('########'),
            'merchant_id' => $merchant->id,
            'product_id' => $product->id,
            'payment_channel_id' => $channel->id,
            'amount_base' => 18500,
            'amount_fee' => 1000,
            'channel_fee' => 1000,
            'admin_markup' => 0,
            'amount_total' => 19500,
            'margin' => 3000,
            'status' => 'COMPLETED',
        ], $over));
    }

    private function bill(User $merchant, array $over = []): ServiceInvoice
    {
        return ServiceInvoice::factory()->create(array_merge([
            'merchant_id' => $merchant->id,
            'service_id' => Service::factory()->create(['name' => 'Digiflazz'])->id,
            'service_name' => 'Digiflazz',
            'amount' => 250000,
        ], $over));
    }

    public function test_semua_merges_both_sources_newest_first(): void
    {
        $merchant = $this->merchant();
        $this->sale($merchant, ['created_at' => now()->subDays(2)]);
        $this->bill($merchant, ['created_at' => now()->subDay()]);
        Sanctum::actingAs($merchant);

        $response = $this->getJson('/api/v1/payment-admin/transactions')->assertOk();

        $rows = $response->json('data.data');
        $this->assertCount(2, $rows);
        $this->assertSame('service', $rows[0]['type']);
        $this->assertSame('sale', $rows[1]['type']);
        $this->assertSame(2, $response->json('data.total'));
    }

    public function test_a_sale_is_marked_in_and_a_service_bill_out(): void
    {
        $merchant = $this->merchant();
        $this->sale($merchant);
        $this->bill($merchant);
        Sanctum::actingAs($merchant);

        $rows = collect($this->getJson('/api/v1/payment-admin/transactions')->json('data.data'))
            ->keyBy('type');

        $this->assertSame('in', $rows['sale']['direction']);
        $this->assertSame(18500, $rows['sale']['amount']);
        $this->assertSame('Diamond 100', $rows['sale']['title']);
        $this->assertSame('QRIS', $rows['sale']['payment_channel']);

        $this->assertSame('out', $rows['service']['direction']);
        $this->assertSame(250000, $rows['service']['amount']);
        $this->assertSame('Digiflazz', $rows['service']['title']);
        $this->assertNull($rows['service']['payment_channel']);
    }

    public function test_type_filters_narrow_to_one_source(): void
    {
        $merchant = $this->merchant();
        $this->sale($merchant);
        $this->bill($merchant);
        Sanctum::actingAs($merchant);

        $sales = $this->getJson('/api/v1/payment-admin/transactions?type=sale')->json('data.data');
        $this->assertCount(1, $sales);
        $this->assertSame('sale', $sales[0]['type']);

        $services = $this->getJson('/api/v1/payment-admin/transactions?type=service')->json('data.data');
        $this->assertCount(1, $services);
        $this->assertSame('service', $services[0]['type']);
    }

    /**
     * Ids are unique only within a source, so a sale and a bill can both be
     * id 1. Collapsing them would drop a row from the client's history.
     */
    public function test_ids_colliding_across_sources_produce_two_rows(): void
    {
        $merchant = $this->merchant();
        $sale = $this->sale($merchant);
        $bill = $this->bill($merchant);
        Sanctum::actingAs($merchant);

        $rows = $this->getJson('/api/v1/payment-admin/transactions')->json('data.data');

        $this->assertCount(2, $rows);
        $keys = collect($rows)->map(fn ($r) => $r['type'].'-'.$r['id'])->all();
        $this->assertContains('sale-'.$sale->id, $keys);
        $this->assertContains('service-'.$bill->id, $keys);
    }

    public function test_a_client_sees_neither_another_clients_sales_nor_bills(): void
    {
        $owner = $this->merchant();
        $this->sale($owner);
        $this->bill($owner);

        Sanctum::actingAs($this->merchant());

        $this->getJson('/api/v1/payment-admin/transactions')
            ->assertOk()
            ->assertJsonPath('data.total', 0);
    }

    public function test_the_client_projection_omits_platform_figures(): void
    {
        $merchant = $this->merchant();
        $this->sale($merchant);
        Sanctum::actingAs($merchant);

        $row = $this->getJson('/api/v1/payment-admin/transactions')->json('data.data.0');

        $this->assertArrayNotHasKey('platform_profit', $row);
        $this->assertArrayNotHasKey('gateway_fee', $row);
        $this->assertArrayNotHasKey('admin_fee', $row);
        $this->assertArrayNotHasKey('merchant', $row);
    }

    public function test_the_internal_projection_reports_zero_fees_on_a_service_row(): void
    {
        $merchant = $this->merchant();
        $sale = $this->sale($merchant);
        Payment::create([
            'transaction_id' => $sale->id,
            'payment_channel_id' => $sale->payment_channel_id,
            'reference_id' => 'PAY-'.$sale->invoice_number,
            'gross_amount' => 19500,
            'admin_fee' => 1000,
            'channel_fee' => 1000,
            'admin_markup' => 0,
            'gateway_fee' => 700,
            'status' => '3',
        ]);
        $this->bill($merchant);

        Sanctum::actingAs($this->internal());
        $rows = collect($this->getJson('/api/v1/payment-internal/transactions')->json('data.data'))
            ->keyBy('type');

        $this->assertSame(1000, $rows['sale']['admin_fee']);
        $this->assertSame(700, $rows['sale']['gateway_fee']);
        $this->assertSame(300, $rows['sale']['platform_profit']);
        $this->assertSame($merchant->name, $rows['sale']['merchant']['name']);

        // A service bill has no channel and no gateway; the whole amount is kita's.
        $this->assertSame(0, $rows['service']['admin_fee']);
        $this->assertSame(0, $rows['service']['gateway_fee']);
        $this->assertSame(250000, $rows['service']['platform_profit']);
    }

    public function test_search_matches_both_invoice_number_formats(): void
    {
        $merchant = $this->merchant();
        $sale = $this->sale($merchant);
        $bill = $this->bill($merchant, ['invoice_number' => 'SINV-202608-ZZTOP1']);
        Sanctum::actingAs($merchant);

        $this->getJson('/api/v1/payment-admin/transactions?search='.$sale->invoice_number)
            ->assertOk()->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.data.0.type', 'sale');

        $this->getJson('/api/v1/payment-admin/transactions?search=ZZTOP1')
            ->assertOk()->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.data.0.invoice_number', $bill->invoice_number);
    }

    /** A platform-owned sale belongs to nobody's client feed. */
    public function test_a_sale_with_no_merchant_is_excluded_from_the_internal_feed(): void
    {
        $merchant = $this->merchant();
        $this->sale($merchant, ['merchant_id' => null]);
        Sanctum::actingAs($this->internal());

        $this->getJson('/api/v1/payment-internal/transactions')
            ->assertOk()
            ->assertJsonPath('data.total', 0);
    }

    public function test_per_page_is_clamped(): void
    {
        $merchant = $this->merchant();
        $this->sale($merchant);
        Sanctum::actingAs($merchant);

        $this->getJson('/api/v1/payment-admin/transactions?per_page=9999')
            ->assertOk()
            ->assertJsonPath('data.per_page', 100);
    }
}
