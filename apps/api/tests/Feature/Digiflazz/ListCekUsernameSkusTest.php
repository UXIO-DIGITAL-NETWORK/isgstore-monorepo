<?php

namespace Tests\Feature\Digiflazz;

use App\Models\Role;
use App\Models\User;
use App\Services\DigiflazzService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ListCekUsernameSkusTest extends TestCase
{
    use RefreshDatabase;

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
    }

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    /**
     * A mix of a cek-username SKU (matched by name), a genuinely-named inquiry
     * SKU, and ordinary pulsa rows that must be excluded.
     */
    private function fakeMixedList(): void
    {
        $items = [
            [
                'product_name' => 'Mobile Legends Cek ID/Username',
                'category' => 'Games',
                'brand' => 'MOBILE LEGENDS',
                'buyer_sku_code' => 'mlus',
                'buyer_product_status' => true,
                'seller_product_status' => true,
                'price' => 100,
                'desc' => 'Cek nickname Mobile Legends',
            ],
            [
                'product_name' => 'Free Fire',
                'category' => 'Games',
                'brand' => 'FREE FIRE',
                'buyer_sku_code' => 'ffusername',
                'buyer_product_status' => true,
                'seller_product_status' => true,
                'price' => 100,
                'desc' => '-',
            ],
            [
                'product_name' => 'Xl 100.000',
                'category' => 'Pulsa',
                'brand' => 'XL',
                'buyer_sku_code' => 'X100',
                'buyer_product_status' => true,
                'seller_product_status' => true,
                'price' => 98000,
                'desc' => 'Pulsa Xl Rp 100.000',
            ],
        ];
        Http::fake(['*/price-list' => Http::response(['data' => $items])]);
    }

    public function test_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/v1/digiflazz/cek-username-skus')->assertUnauthorized();
    }

    public function test_endpoint_forbidden_for_non_admin(): void
    {
        $role = Role::factory()->create(['name' => 'Member']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));

        $this->getJson('/api/v1/digiflazz/cek-username-skus')->assertForbidden();
    }

    public function test_lists_only_cek_username_skus(): void
    {
        $this->actingAsAdmin();
        $this->fakeMixedList();

        $response = $this->getJson('/api/v1/digiflazz/cek-username-skus')
            ->assertOk()
            ->assertJsonPath('status', 'success');

        $skus = collect($response->json('data'))->pluck('sku');

        // Both known cek-username SKUs are surfaced (mlus via name, ffusername via sku).
        $this->assertContains('mlus', $skus);
        $this->assertContains('ffusername', $skus);
        // The plain pulsa SKU is excluded.
        $this->assertNotContains('X100', $skus);
        $this->assertCount(2, $skus);
    }

    public function test_labels_combine_brand_and_product_name(): void
    {
        $this->actingAsAdmin();
        $this->fakeMixedList();

        $rows = collect($this->getJson('/api/v1/digiflazz/cek-username-skus')->assertOk()->json('data'))
            ->keyBy('sku');

        $this->assertSame('MOBILE LEGENDS — Mobile Legends Cek ID/Username', $rows['mlus']['label']);
        $this->assertSame('FREE FIRE — Free Fire', $rows['ffusername']['label']);
    }

    public function test_empty_price_list_returns_empty_list(): void
    {
        $this->actingAsAdmin();
        Http::fake(['*/price-list' => Http::response(['data' => []])]);

        $this->getJson('/api/v1/digiflazz/cek-username-skus')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_returns_502_when_digiflazz_unavailable(): void
    {
        $this->actingAsAdmin();
        Http::fake(['*/price-list' => Http::response('', 500)]);

        $this->getJson('/api/v1/digiflazz/cek-username-skus')
            ->assertStatus(502)
            ->assertJsonPath('status', 'error');
    }
}
