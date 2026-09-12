<?php

namespace Tests\Feature\Uxiolabs;

use App\Models\Category;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\SupplierCategory;
use App\Models\User;
use App\Services\UxiolabsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Narrowing the Add Product Provider list.
 *
 * The candidate feed is the provider's whole catalogue for every configured
 * game, which on a real install is thousands of rows spanning three orders of
 * magnitude in cost. Search alone cannot answer "the Free Fire denominations
 * under twenty thousand", so the filters carry the page.
 *
 * The set below is deliberately spread across two games and a wide cost range —
 * a filter that quietly does nothing still passes against a uniform fixture.
 */
class PoolCandidateFiltersTest extends TestCase
{
    use RefreshDatabase;

    private Supplier $uxiolabs;

    private Category $mobileLegends;

    private Category $freeFire;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.uxiolabs.api_key' => 'test-api-key']);
        Cache::forget(UxiolabsService::PRICE_LIST_CACHE_KEY);

        $this->uxiolabs = Supplier::factory()->create(['name' => 'Uxiolabs']);

        $this->mobileLegends = Category::factory()->create(['name' => 'Mobile Legends']);
        $this->freeFire = Category::factory()->create(['name' => 'Free Fire']);

        // Only a mapped provider category reaches this list at all.
        SupplierCategory::create([
            'supplier_id' => $this->uxiolabs->id,
            'provider_category' => 'Mobile Legends Indonesia',
            'category_id' => $this->mobileLegends->id,
        ]);
        SupplierCategory::create([
            'supplier_id' => $this->uxiolabs->id,
            'provider_category' => 'Free Fire',
            'category_id' => $this->freeFire->id,
        ]);

        $this->fakeServiceList();
        $this->actingAsAdmin();
    }

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
    }

    private function fakeServiceList(): void
    {
        $items = [
            $this->item('ML5', '5 Diamonds', 'Mobile Legends Indonesia', 1_500),
            $this->item('ML50', '50 + 50 Diamonds', 'Mobile Legends Indonesia', 16_242),
            $this->item('ML500', '500 + 500 Diamonds', 'Mobile Legends Indonesia', 162_954),
            $this->item('ML4000', '4003 + 827 Diamonds', 'Mobile Legends Indonesia', 1_311_279),
            $this->item('FF10', '10 Diamonds', 'Free Fire', 2_000),
            $this->item('FF100', '100 Diamonds', 'Free Fire', 18_500),
            // Not mapped under Category Provider — must never appear, whatever
            // the filters say.
            $this->item('PLN20', 'PLN 20.000', 'PLN', 20_500),
        ];

        Http::fake(['*/service' => Http::response(['status' => true, 'msg' => 'ok', 'data' => $items])]);
    }

    /** @return array<string,mixed> */
    private function item(string $id, string $name, string $kategori, int $cost): array
    {
        return [
            'id' => $id,
            'nama_layanan' => $name,
            'kategori' => $kategori,
            'harga' => $cost,
            'harga_gold' => $cost,
            'harga_silver' => $cost,
            'harga_pro' => $cost,
            'status' => 'aktif',
        ];
    }

    /**
     * @param  array<string,mixed>  $query
     * @return array<int,string>
     */
    private function skus(array $query = []): array
    {
        $response = $this->getJson('/api/v1/uxiolabs/pool-candidates?'.http_build_query(
            // `all` throughout, so each test narrows on exactly the axis it names
            // rather than on the page's defaults.
            array_merge(['pool_state' => 'all', 'availability' => 'all', 'per_page' => 100], $query)
        ))->assertOk();

        return array_column($response->json('data.data'), 'buyer_sku_code');
    }

    public function test_it_filters_by_provider_category(): void
    {
        $this->assertSame(['FF10', 'FF100'], $this->skus(['provider_category' => 'Free Fire']));
    }

    public function test_it_filters_by_our_own_mapped_category(): void
    {
        // Two providers can map onto one of our categories, so filtering by the
        // category an admin actually thinks in has to be its own axis.
        $this->assertSame(['FF10', 'FF100'], $this->skus(['category_id' => $this->freeFire->id]));
    }

    public function test_it_filters_by_a_cost_floor(): void
    {
        $this->assertSame(['ML500', 'ML4000'], $this->skus(['cost_min' => 100_000]));
    }

    public function test_it_filters_by_a_cost_ceiling(): void
    {
        $this->assertSame(['ML5', 'FF10'], $this->skus(['cost_max' => 2_000]));
    }

    public function test_it_filters_by_a_cost_range_inclusively(): void
    {
        // Inclusive at both ends: a bound typed from the range hint the page
        // shows must include the row it was read off.
        $this->assertSame(['ML50', 'FF100'], $this->skus(['cost_min' => 16_242, 'cost_max' => 18_500]));
    }

    public function test_it_rejects_a_range_that_cannot_match(): void
    {
        $this->getJson('/api/v1/uxiolabs/pool-candidates?cost_min=50000&cost_max=1000')
            ->assertUnprocessable()
            ->assertJsonPath('errors.cost_max.0', 'Harga maksimum tidak boleh lebih kecil dari harga minimum.');
    }

    public function test_it_sorts_by_cost(): void
    {
        $this->assertSame(
            ['ML5', 'FF10', 'ML50', 'FF100', 'ML500', 'ML4000'],
            $this->skus(['sort' => 'cost_asc'])
        );

        $this->assertSame(
            ['ML4000', 'ML500', 'FF100', 'ML50', 'FF10', 'ML5'],
            $this->skus(['sort' => 'cost_desc'])
        );
    }

    public function test_it_sorts_by_name(): void
    {
        // Natural, so the leading numbers read as numbers: 5, 10, 50, 100, 500,
        // 4003. A plain string sort would put "4003" between "10" and "50".
        $this->assertSame(
            ['ML5', 'FF10', 'ML50', 'FF100', 'ML500', 'ML4000'],
            $this->skus(['sort' => 'name_asc'])
        );
    }

    public function test_it_leaves_the_provider_feed_order_alone_by_default(): void
    {
        // The unsorted order is the provider's own, which is what the page has
        // always shown — sorting is opt-in, not a silent new default.
        $this->assertSame(['ML5', 'ML50', 'ML500', 'ML4000', 'FF10', 'FF100'], $this->skus());
    }

    public function test_filters_combine_rather_than_replace_one_another(): void
    {
        $this->assertSame(
            ['ML50'],
            $this->skus([
                'provider_category' => 'Mobile Legends Indonesia',
                'cost_min' => 10_000,
                'cost_max' => 100_000,
                'search' => 'Diamonds',
            ])
        );
    }

    public function test_no_filter_reaches_an_unmapped_provider_category(): void
    {
        // Category Provider is what admits a SKU to this page; a filter must not
        // become a way around it.
        $this->assertNotContains('PLN20', $this->skus(['cost_min' => 20_000, 'cost_max' => 21_000]));
        $this->assertSame([], $this->skus(['provider_category' => 'PLN']));
    }

    public function test_facets_describe_what_there_is_to_filter_on(): void
    {
        // The page cannot invent this list: the provider categories that exist
        // depend on what an admin has mapped, and the cost bounds on what the
        // provider is charging today.
        $response = $this->getJson('/api/v1/uxiolabs/pool-facets')->assertOk();

        $this->assertSame(
            [
                ['provider_category' => 'Free Fire', 'mapped_category_name' => 'Free Fire', 'count' => 2],
                ['provider_category' => 'Mobile Legends Indonesia', 'mapped_category_name' => 'Mobile Legends', 'count' => 4],
            ],
            $response->json('data.provider_categories')
        );

        $this->assertSame(
            [
                ['id' => $this->freeFire->id, 'name' => 'Free Fire', 'count' => 2],
                ['id' => $this->mobileLegends->id, 'name' => 'Mobile Legends', 'count' => 4],
            ],
            $response->json('data.categories')
        );

        $this->assertSame(1_500, $response->json('data.cost.min'));
        $this->assertSame(1_311_279, $response->json('data.cost.max'));
    }

    public function test_facets_ignore_the_pool_and_availability_filters(): void
    {
        // They describe the whole universe on purpose. Recomputing them against
        // the active filters makes options disappear as they are used, which is
        // how a filter bar becomes a maze.
        $response = $this->getJson('/api/v1/uxiolabs/pool-facets')->assertOk();

        $this->assertSame(6, array_sum(array_column($response->json('data.provider_categories'), 'count')));
    }
}
