<?php

namespace Tests\Feature\Storefront;

use App\Models\Category;
use App\Models\MembershipPlan;
use App\Models\PaymentChannel;
use App\Models\Product;
use App\Models\ProductPlanPrice;
use App\Models\Role;
use App\Models\SupplierProduct;
use App\Models\User;
use App\Support\Membership\DefaultPlan;
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

    public function test_products_endpoint_quotes_the_plan_price_to_a_signed_in_member(): void
    {
        $game = Category::factory()->create(['slug' => 'mobile-legends']);
        $product = $this->sellableProduct($game, ['price_member' => 25000]);

        $plan = MembershipPlan::create([
            'code' => 'gold',
            'name' => ['id' => 'Gold'],
            'price' => 300000,
            'duration_days' => null,
            'is_active' => true,
            'sort_order' => 3,
        ]);

        ProductPlanPrice::create([
            'product_id' => $product->id,
            'membership_plan_id' => $plan->id,
            'price' => 21000,
        ]);

        $role = Role::factory()->create(['name' => 'Member']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id, 'membership_plan_id' => $plan->id]), ['access-api']);

        // Must match what CheckoutAction will charge — a catalog that quotes the
        // default price to a Gold member shows one number and bills another.
        $this->getJson('/api/v1/games/mobile-legends/products')
            ->assertOk()
            ->assertJsonPath('data.products.0.price', 21000);
    }

    public function test_products_endpoint_falls_back_to_the_default_tier_for_an_unpriced_plan(): void
    {
        // A plan created after the last repricing run has no row for this
        // product. The honest answer is the default tier — never more than the
        // customer expected to pay.
        $game = Category::factory()->create(['slug' => 'mobile-legends']);
        $this->sellableProduct($game, ['price_member' => 25000]);

        $plan = MembershipPlan::create([
            'code' => 'hokage',
            'name' => ['id' => 'Hokage'],
            'price' => 10000,
            'duration_days' => 30,
            'is_active' => true,
            'sort_order' => 5,
        ]);

        $role = Role::factory()->create(['name' => 'Member']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id, 'membership_plan_id' => $plan->id]), ['access-api']);

        $this->getJson('/api/v1/games/mobile-legends/products')
            ->assertOk()
            ->assertJsonPath('data.products.0.price', 25000);
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

    /**
     * Prefixed with /storefront: /v1/payment-channels is now the admin-gated
     * CRUD route, and Laravel keys its route collection on method+uri — the
     * two cannot share a path.
     */
    public function test_payment_channels_hide_balance_from_guests(): void
    {
        PaymentChannel::factory()->create(['channel_code' => 'qris', 'payment_type' => 'qris', 'is_active' => true]);
        PaymentChannel::factory()->balance()->create();

        $codes = collect($this->getJson('/api/v1/storefront/payment-channels')->assertOk()->json('data.channels'))
            ->pluck('channel_code');

        $this->assertContains('qris', $codes->all());
        // CheckoutAction rejects `balance` for guests, so offering it here would
        // be a dead end.
        $this->assertNotContains('balance', $codes->all());
    }

    public function test_payment_channels_expose_only_va_ewallet_and_qris_categories(): void
    {
        PaymentChannel::factory()->create(['channel_code' => 'bca_va', 'payment_type' => 'virtual_account', 'is_active' => true]);
        PaymentChannel::factory()->create(['channel_code' => 'dana', 'payment_type' => 'ewallet', 'is_active' => true]);
        PaymentChannel::factory()->create(['channel_code' => 'qris', 'payment_type' => 'qris', 'is_active' => true]);
        // Active but no longer an offered category — must never reach the storefront.
        PaymentChannel::factory()->create(['channel_code' => 'alfamart', 'payment_type' => 'convenience_store', 'is_active' => true]);
        PaymentChannel::factory()->create(['channel_code' => 'payment_link', 'payment_type' => 'payment_link', 'is_active' => true]);

        $types = collect($this->getJson('/api/v1/storefront/payment-channels')->assertOk()->json('data.channels'))
            ->pluck('payment_type')
            ->unique();

        $this->assertEqualsCanonicalizing(['virtual_account', 'ewallet', 'qris'], $types->all());
    }

    public function test_payment_channels_expose_balance_to_a_signed_in_member(): void
    {
        PaymentChannel::factory()->balance()->create();

        $role = Role::factory()->create(['name' => 'Member']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id, 'balance' => 50000]), ['access-api']);

        $channels = collect($this->getJson('/api/v1/storefront/payment-channels')->assertOk()->json('data.channels'));
        $balance = $channels->firstWhere('channel_code', 'balance');

        $this->assertNotNull($balance);
        $this->assertSame(50000, $balance['balance']);
    }

    public function test_price_list_exposes_retail_prices_only(): void
    {
        $game = Category::factory()->create(['name' => 'Mobile Legends']);
        $product = $this->sellableProduct($game, ['price_modal' => 19000, 'price_member' => 25000]);

        ProductPlanPrice::create([
            'product_id' => $product->id,
            'membership_plan_id' => DefaultPlan::id(),
            'price' => 25000,
        ]);

        $row = $this->getJson('/api/v1/price-list')->assertOk()->json('data.data.0');

        $this->assertSame(25000, $row['normal_price']);
        $this->assertArrayNotHasKey('price_modal', $row, 'Cost data must never reach the public price list.');
    }

    public function test_price_list_emits_a_column_per_plan_and_hides_the_top_tier(): void
    {
        // The top tier's price is the reason to subscribe — publishing it gives
        // away the incentive. The row still appears so the ladder is visible.
        $game = Category::factory()->create(['name' => 'Mobile Legends']);
        $product = $this->sellableProduct($game, ['price_modal' => 19000, 'price_member' => 25000]);

        $platinum = MembershipPlan::create([
            'code' => 'platinum', 'name' => ['id' => 'Platinum'], 'price' => 150000,
            'duration_days' => null, 'is_active' => true, 'sort_order' => 2,
        ]);
        $gold = MembershipPlan::create([
            'code' => 'gold', 'name' => ['id' => 'Gold'], 'price' => 300000,
            'duration_days' => null, 'is_active' => true, 'sort_order' => 3,
        ]);

        foreach ([DefaultPlan::id() => 25000, $platinum->id => 23000, $gold->id => 21000] as $planId => $price) {
            ProductPlanPrice::create([
                'product_id' => $product->id,
                'membership_plan_id' => $planId,
                'price' => $price,
            ]);
        }

        $tiers = collect($this->getJson('/api/v1/price-list')->assertOk()->json('data.data.0.tiers'));

        $this->assertCount(3, $tiers, 'One column per active plan, in the admin ordering.');
        $this->assertSame(25000, $tiers->firstWhere('plan_code', 'free')['price']);
        $this->assertSame(23000, $tiers->firstWhere('plan_code', 'platinum')['price']);

        $top = $tiers->firstWhere('plan_code', 'gold');
        $this->assertTrue($top['is_hidden']);
        $this->assertNull($top['price'], 'The highest tier must not publish its price.');
    }

    public function test_unknown_game_returns_not_found(): void
    {
        $this->getJson('/api/v1/games/does-not-exist')->assertNotFound();
    }
}
