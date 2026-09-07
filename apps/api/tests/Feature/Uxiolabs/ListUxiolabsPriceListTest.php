<?php

namespace Tests\Feature\Uxiolabs;

use App\Models\Product;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Models\User;
use App\Services\UxiolabsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ListUxiolabsPriceListTest extends TestCase
{
    use RefreshDatabase;

    private Supplier $uxiolabs;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.uxiolabs.api_key' => 'test-api-key']);

        // The price list is cached for 5 minutes and shared across tests — clear
        // it so each test's Http::fake is the source of truth.
        Cache::forget(UxiolabsService::PRICE_LIST_CACHE_KEY);

        $this->uxiolabs = Supplier::factory()->create(['name' => 'Uxiolabs']);
    }

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
    }

    private function fakeServiceList(): void
    {
        $items = [
            [
                'id' => 'X100',
                'nama_layanan' => 'Xl 100.000',
                'kategori' => 'Pulsa',
                'harga' => 98000,
                'harga_gold' => 97000,
                'harga_silver' => 97500,
                'harga_pro' => 96500,
                'status' => 'aktif',
            ],
            [
                'id' => 'S5',
                'nama_layanan' => 'Telkomsel Pulsa 5.000',
                'kategori' => 'Pulsa',
                'harga' => 5100,
                'harga_gold' => 5000,
                'harga_silver' => 5050,
                'harga_pro' => 4950,
                'status' => 'nonaktif',
            ],
        ];
        Http::fake(['*/service' => Http::response(['status' => true, 'msg' => 'ok', 'data' => $items])]);
    }

    public function test_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/v1/uxiolabs/price-list')->assertUnauthorized();
    }

    public function test_lists_price_list_with_pagination_envelope(): void
    {
        $this->actingAsAdmin();
        $this->fakeServiceList();

        $this->getJson('/api/v1/uxiolabs/price-list')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 2)
            ->assertJsonCount(2, 'data.data')
            ->assertJsonPath('data.data.0.buyer_sku_code', 'X100')
            ->assertJsonPath('data.data.0.name', 'Xl 100.000')
            ->assertJsonPath('data.data.0.category', 'Pulsa')
            ->assertJsonPath('data.data.0.cost', 98000)
            ->assertJsonPath('data.data.0.harga_gold', 97000)
            ->assertJsonPath('data.data.0.available', true)
            ->assertJsonPath('data.data.0.already_mapped', false)
            ->assertJsonPath('data.data.1.available', false); // status nonaktif
    }

    public function test_configured_price_tier_drives_cost_column(): void
    {
        config(['services.uxiolabs.price_tier' => 'harga_gold']);

        $this->actingAsAdmin();
        $this->fakeServiceList();

        $this->getJson('/api/v1/uxiolabs/price-list')
            ->assertOk()
            ->assertJsonPath('data.data.0.cost', 97000);
    }

    public function test_flags_already_mapped_services(): void
    {
        $this->actingAsAdmin();
        $product = Product::factory()->create(['code' => 'X100']);
        SupplierProduct::factory()->for($product)->for($this->uxiolabs)->create(['buyer_sku_code' => 'X100']);
        $this->fakeServiceList();

        $response = $this->getJson('/api/v1/uxiolabs/price-list')->assertOk();

        $rows = collect($response->json('data.data'))->keyBy('buyer_sku_code');
        $this->assertTrue($rows['X100']['already_mapped']);
        $this->assertFalse($rows['S5']['already_mapped']);
    }

    public function test_search_filters_by_name_id_and_category(): void
    {
        $this->actingAsAdmin();
        $this->fakeServiceList();

        $this->getJson('/api/v1/uxiolabs/price-list?search=telkomsel')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.data.0.buyer_sku_code', 'S5');
    }

    public function test_only_unmapped_excludes_mapped_rows(): void
    {
        $this->actingAsAdmin();
        $product = Product::factory()->create(['code' => 'X100']);
        SupplierProduct::factory()->for($product)->for($this->uxiolabs)->create(['buyer_sku_code' => 'X100']);
        $this->fakeServiceList();

        // Send the real axios shape: a JS boolean serializes to the string
        // "true", which the plain `boolean` rule would reject (422) without the
        // request's prepareForValidation coercion.
        $this->getJson('/api/v1/uxiolabs/price-list?only_unmapped=true')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.data.0.buyer_sku_code', 'S5');
    }

    public function test_only_unmapped_false_returns_all_rows(): void
    {
        $this->actingAsAdmin();
        $product = Product::factory()->create(['code' => 'X100']);
        SupplierProduct::factory()->for($product)->for($this->uxiolabs)->create(['buyer_sku_code' => 'X100']);
        $this->fakeServiceList();

        $this->getJson('/api/v1/uxiolabs/price-list?only_unmapped=false')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 2);
    }

    public function test_empty_price_list_returns_empty_paginator(): void
    {
        $this->actingAsAdmin();
        Http::fake(['*/service' => Http::response(['status' => true, 'msg' => 'ok', 'data' => []])]);

        $this->getJson('/api/v1/uxiolabs/price-list')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 0)
            ->assertJsonCount(0, 'data.data');
    }

    public function test_returns_502_when_uxiolabs_unavailable(): void
    {
        $this->actingAsAdmin();
        Http::fake(['*/service' => Http::response('', 500)]);

        $this->getJson('/api/v1/uxiolabs/price-list')
            ->assertStatus(502);
    }

    // uxiolabs returns HTTP 200 with {status:false, msg} when auth fails (bad
    // api_key, server IP not whitelisted). This must be a clean 502, not an
    // empty "successful" list that would deactivate every product downstream.
    public function test_returns_502_when_uxiolabs_returns_an_error_envelope(): void
    {
        $this->actingAsAdmin();
        Http::fake(['*/service' => Http::response([
            'status' => false,
            'msg' => 'api_key tidak ditemukan',
            'data' => [],
        ])]);

        $this->getJson('/api/v1/uxiolabs/price-list')
            ->assertStatus(502)
            ->assertJsonPath('status', 'error')
            ->assertJson(fn ($json) => $json->where('message', fn ($m) => str_contains($m, 'api_key tidak ditemukan'))->etc());
    }

    public function test_returns_502_when_price_list_data_is_missing(): void
    {
        $this->actingAsAdmin();
        Http::fake(['*/service' => Http::response(['msg' => 'no data key'])]);

        $this->getJson('/api/v1/uxiolabs/price-list')
            ->assertStatus(502);
    }
}
