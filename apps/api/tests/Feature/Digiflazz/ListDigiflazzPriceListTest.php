<?php

namespace Tests\Feature\Digiflazz;

use App\Models\Product;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Models\User;
use App\Services\DigiflazzService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ListDigiflazzPriceListTest extends TestCase
{
    use RefreshDatabase;

    private Supplier $digiflazz;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.digiflazz.username' => 'testuser',
            'services.digiflazz.key' => 'testkey',
        ]);

        // The price list is cached for 5 minutes and shared across tests — clear
        // it so each test's Http::fake is the source of truth.
        Cache::forget(DigiflazzService::PRICE_LIST_CACHE_KEY.'prepaid');
        Cache::forget(DigiflazzService::PRICE_LIST_CACHE_KEY.'pasca');

        $this->digiflazz = Supplier::factory()->create(['name' => 'Digiflazz']);
    }

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    private function fakePrepaidList(): void
    {
        $items = [
            [
                'product_name' => 'Xl 100.000',
                'category' => 'Pulsa',
                'brand' => 'XL',
                'type' => 'Umum',
                'seller_name' => 'PT. ABC',
                'price' => 98000,
                'buyer_sku_code' => 'X100',
                'buyer_product_status' => true,
                'seller_product_status' => true,
                'unlimited_stock' => true,
                'stock' => 0,
                'multi' => true,
                'start_cut_off' => '23:45',
                'end_cut_off' => '00:15',
                'desc' => 'Pulsa Xl Rp 100.000',
            ],
            [
                'product_name' => 'Telkomsel Pulsa 5.000',
                'category' => 'Pulsa',
                'brand' => 'TELKOMSEL',
                'type' => 'Umum',
                'seller_name' => 'PT. BCA',
                'price' => 5100,
                'buyer_sku_code' => 'S5',
                'buyer_product_status' => true,
                'seller_product_status' => false,
                'unlimited_stock' => false,
                'stock' => 1200,
                'multi' => false,
                'start_cut_off' => '00:00',
                'end_cut_off' => '00:00',
                'desc' => 'Pulsa Telkomsel Rp 5.000',
            ],
        ];
        Http::fake(['*/price-list' => Http::response(['data' => $items])]);
    }

    public function test_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/v1/digiflazz/price-list')->assertUnauthorized();
    }

    public function test_lists_price_list_with_pagination_envelope(): void
    {
        $this->actingAsAdmin();
        $this->fakePrepaidList();

        $this->getJson('/api/v1/digiflazz/price-list?type=prepaid')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 2)
            ->assertJsonCount(2, 'data.data')
            ->assertJsonPath('data.data.0.buyer_sku_code', 'X100')
            ->assertJsonPath('data.data.0.name', 'Xl 100.000')
            ->assertJsonPath('data.data.0.cost', 98000)
            ->assertJsonPath('data.data.0.available', true)
            ->assertJsonPath('data.data.0.already_mapped', false)
            ->assertJsonPath('data.data.0.unlimited_stock', true)
            ->assertJsonPath('data.data.1.available', false); // seller_product_status false
    }

    public function test_flags_already_mapped_skus(): void
    {
        $this->actingAsAdmin();
        $product = Product::factory()->create(['code' => 'X100']);
        SupplierProduct::factory()->for($product)->for($this->digiflazz)->create(['buyer_sku_code' => 'X100']);
        $this->fakePrepaidList();

        $response = $this->getJson('/api/v1/digiflazz/price-list?type=prepaid')->assertOk();

        $rows = collect($response->json('data.data'))->keyBy('buyer_sku_code');
        $this->assertTrue($rows['X100']['already_mapped']);
        $this->assertFalse($rows['S5']['already_mapped']);
    }

    public function test_search_filters_by_name_sku_brand_and_category(): void
    {
        $this->actingAsAdmin();
        $this->fakePrepaidList();

        $this->getJson('/api/v1/digiflazz/price-list?type=prepaid&search=telkomsel')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.data.0.buyer_sku_code', 'S5');
    }

    public function test_only_unmapped_excludes_mapped_rows(): void
    {
        $this->actingAsAdmin();
        $product = Product::factory()->create(['code' => 'X100']);
        SupplierProduct::factory()->for($product)->for($this->digiflazz)->create(['buyer_sku_code' => 'X100']);
        $this->fakePrepaidList();

        // Send the real axios shape: a JS boolean serializes to the string
        // "true", which the plain `boolean` rule would reject (422) without the
        // request's prepareForValidation coercion.
        $this->getJson('/api/v1/digiflazz/price-list?type=prepaid&only_unmapped=true')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.data.0.buyer_sku_code', 'S5');
    }

    public function test_only_unmapped_false_returns_all_rows(): void
    {
        $this->actingAsAdmin();
        $product = Product::factory()->create(['code' => 'X100']);
        SupplierProduct::factory()->for($product)->for($this->digiflazz)->create(['buyer_sku_code' => 'X100']);
        $this->fakePrepaidList();

        $this->getJson('/api/v1/digiflazz/price-list?type=prepaid&only_unmapped=false')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 2);
    }

    public function test_pasca_type_uses_admin_as_cost_and_exposes_admin_fee_commission(): void
    {
        $this->actingAsAdmin();
        $items = [[
            'product_name' => 'Pln Postpaid',
            'category' => 'Pascabayar',
            'brand' => 'PLN',
            'seller_name' => 'PT. ABC',
            'admin' => 2750,
            'commission' => 1800,
            'buyer_sku_code' => 'pln',
            'buyer_product_status' => true,
            'seller_product_status' => true,
            'desc' => '-',
        ]];
        Http::fake(['*/price-list' => Http::response(['data' => $items])]);

        $this->getJson('/api/v1/digiflazz/price-list?type=pasca')
            ->assertOk()
            ->assertJsonPath('data.data.0.cost', 2750)
            ->assertJsonPath('data.data.0.admin_fee', 2750)
            ->assertJsonPath('data.data.0.commission', 1800);
    }

    public function test_empty_price_list_returns_empty_paginator(): void
    {
        $this->actingAsAdmin();
        Http::fake(['*/price-list' => Http::response(['data' => []])]);

        $this->getJson('/api/v1/digiflazz/price-list?type=prepaid')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 0)
            ->assertJsonCount(0, 'data.data');
    }

    public function test_returns_502_when_digiflazz_unavailable(): void
    {
        $this->actingAsAdmin();
        Http::fake(['*/price-list' => Http::response('', 500)]);

        $this->getJson('/api/v1/digiflazz/price-list?type=prepaid')
            ->assertStatus(502);
    }

    // Digiflazz returns HTTP 200 with an error OBJECT under `data` (not a list)
    // when auth/permission fails (e.g. rc 41 "Signature tidak valid", server IP
    // not whitelisted). This must be a clean 502, not an uncaught TypeError → 500.
    public function test_returns_502_when_digiflazz_returns_an_error_envelope(): void
    {
        $this->actingAsAdmin();
        Http::fake(['*/price-list' => Http::response([
            'data' => ['rc' => '41', 'message' => 'Signature tidak valid'],
        ])]);

        $this->getJson('/api/v1/digiflazz/price-list?type=prepaid')
            ->assertStatus(502)
            ->assertJsonPath('status', 'error')
            ->assertJson(fn ($json) => $json->where('message', fn ($m) => str_contains($m, 'Signature tidak valid'))->etc());
    }

    public function test_returns_502_when_price_list_data_is_missing(): void
    {
        $this->actingAsAdmin();
        Http::fake(['*/price-list' => Http::response(['message' => 'no data key'])]);

        $this->getJson('/api/v1/digiflazz/price-list?type=prepaid')
            ->assertStatus(502);
    }
}
