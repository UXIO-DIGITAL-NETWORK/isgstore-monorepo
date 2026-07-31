<?php

namespace Tests\Feature\Storefront;

use App\Models\Category;
use App\Models\PaymentChannel;
use App\Models\Product;
use App\Models\Role;
use App\Models\SupplierProduct;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StorefrontCatalogTest extends TestCase
{
    use RefreshDatabase;

    /** A product checkout would actually accept: active, with an active supplier mapping. */
    private function sellableProduct(Category $category, array $attributes = []): Product
    {
        $product = Product::factory()->create(array_merge([
            'category_id' => $category->id,
            'status' => true,
        ], $attributes));

        SupplierProduct::factory()->for($product)->create(['is_active' => true]);

        return $product;
    }

    public function test_games_endpoint_lists_only_games_with_a_sellable_product(): void
    {
        $sellable = Category::factory()->create(['name' => 'Mobile Legends']);
        $this->sellableProduct($sellable);

        // Has a product but no active supplier mapping — checkout would fail on
        // it, so advertising it would sell an order that cannot be fulfilled.
        $unmapped = Category::factory()->create(['name' => 'Unmapped Game']);
        Product::factory()->create(['category_id' => $unmapped->id, 'status' => true]);

        Category::factory()->create(['name' => 'Empty Game']);

        $response = $this->getJson('/api/v1/games')->assertOk();

        $names = collect($response->json('data.data'))->pluck('name');

        $this->assertContains('Mobile Legends', $names->all());
        $this->assertNotContains('Unmapped Game', $names->all());
        $this->assertNotContains('Empty Game', $names->all());
    }

    public function test_games_endpoint_filters_by_search(): void
    {
        $this->sellableProduct(Category::factory()->create(['name' => 'Mobile Legends']));
        $this->sellableProduct(Category::factory()->create(['name' => 'Free Fire']));

        $response = $this->getJson('/api/v1/games?search=Free')->assertOk();

        $this->assertSame(['Free Fire'], collect($response->json('data.data'))->pluck('name')->all());
    }

    public function test_game_detail_is_reachable_by_slug_and_by_code(): void
    {
        $game = Category::factory()->create(['name' => 'Mobile Legends', 'code' => 'mlbb', 'slug' => 'mobile-legends']);
        $this->sellableProduct($game);

        $this->getJson('/api/v1/games/mobile-legends')->assertOk()->assertJsonPath('data.name', 'Mobile Legends');
        // Older rows have no slug and the admin panel links by code, so both resolve.
        $this->getJson('/api/v1/games/mlbb')->assertOk()->assertJsonPath('data.name', 'Mobile Legends');
    }

    public function test_game_detail_exposes_order_form_fields(): void
    {
        $game = Category::factory()->create([
            'slug' => 'mobile-legends',
            'order_form_fields' => [
                'customer_no_template' => '{target_uid}{target_server}',
                'fields' => [
                    ['key' => 'user_id', 'label' => 'User ID', 'type' => 'number', 'required' => true],
                    ['key' => 'zone_id', 'label' => 'Zone ID', 'type' => 'number', 'required' => true],
                ],
            ],
        ]);
        $this->sellableProduct($game);

        $response = $this->getJson('/api/v1/games/mobile-legends')->assertOk();

        $fields = $response->json('data.order_form_fields');

        $this->assertCount(2, $fields);
        $this->assertSame('Zone ID', $fields[1]['label']);
        // The zone must be a free-text numeric input, never a dropdown — a picker
        // produced wrong ids that only failed at the supplier, after payment.
        $this->assertSame('number', $fields[1]['type']);
        $this->assertSame([], $fields[1]['options']);
    }

    public function test_products_endpoint_never_exposes_cost_or_margin(): void
    {
        $game = Category::factory()->create(['slug' => 'mobile-legends']);
        $this->sellableProduct($game, ['price_modal' => 19000, 'price_member' => 25000]);

        $response = $this->getJson('/api/v1/games/mobile-legends/products')->assertOk();

        $this->assertArrayNotHasKey('price_modal', $response->json('data.products.0'));
        $response->assertJsonMissing(['price_modal' => 19000]);
    }

    public function test_products_endpoint_quotes_the_guest_price_to_anonymous_callers(): void
    {
        $game = Category::factory()->create(['slug' => 'mobile-legends']);
        $this->sellableProduct($game, ['price_member' => 25000, 'price_reseller' => 21000]);

        $this->getJson('/api/v1/games/mobile-legends/products')
            ->assertOk()
            ->assertJsonPath('data.products.0.price', 25000);
    }

    public function test_products_endpoint_quotes_the_role_price_to_a_signed_in_member(): void
    {
        $game = Category::factory()->create(['slug' => 'mobile-legends']);
        $this->sellableProduct($game, ['price_member' => 25000, 'price_reseller' => 21000]);

        $role = Role::factory()->create(['name' => 'Reseller']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));

        // Must match what CheckoutAction will charge — a catalog that quotes the
        // guest price to a reseller shows one number and bills another.
        $this->getJson('/api/v1/games/mobile-legends/products')
            ->assertOk()
            ->assertJsonPath('data.products.0.price', 21000);
    }

    public function test_products_endpoint_groups_denominations_by_sub_category(): void
    {
        $game = Category::factory()->create(['slug' => 'mobile-legends']);
        $this->sellableProduct($game, ['name' => '100 Diamonds', 'price_member' => 25000]);

        $response = $this->getJson('/api/v1/games/mobile-legends/products')->assertOk();

        $this->assertSame(['Lainnya'], $response->json('data.groups'));
        // Parsed from the name so the card can show the denomination amount.
        $this->assertSame(100, $response->json('data.products.0.amount'));
    }

    public function test_payment_channels_hide_balance_from_guests(): void
    {
        PaymentChannel::factory()->create(['channel_code' => 'qris', 'payment_type' => 'qris', 'is_active' => true]);
        PaymentChannel::factory()->balance()->create();

        $codes = collect($this->getJson('/api/v1/payment-channels')->assertOk()->json('data'))
            ->pluck('channel_code');

        $this->assertContains('qris', $codes->all());
        // CheckoutAction rejects `balance` for guests, so offering it here would
        // be a dead end.
        $this->assertNotContains('balance', $codes->all());
    }

    public function test_payment_channels_expose_balance_to_a_signed_in_member(): void
    {
        PaymentChannel::factory()->balance()->create();

        $role = Role::factory()->create(['name' => 'Member']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id, 'balance' => 50000]));

        $channels = collect($this->getJson('/api/v1/payment-channels')->assertOk()->json('data'));
        $balance = $channels->firstWhere('channel_code', 'balance');

        $this->assertNotNull($balance);
        $this->assertSame(50000, $balance['balance']);
    }

    public function test_price_list_exposes_retail_prices_only(): void
    {
        $game = Category::factory()->create(['name' => 'Mobile Legends']);
        $this->sellableProduct($game, ['price_modal' => 19000, 'price_member' => 25000, 'price_vip' => 24000]);

        $response = $this->getJson('/api/v1/price-list')->assertOk();

        $row = $response->json('data.data.0');

        $this->assertSame(25000, $row['normal_price']);
        $this->assertSame(24000, $row['gold_price']);
        $this->assertArrayNotHasKey('price_modal', $row);
    }

    public function test_unknown_game_returns_not_found(): void
    {
        $this->getJson('/api/v1/games/does-not-exist')->assertNotFound();
    }
}
