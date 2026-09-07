<?php

declare(strict_types=1);

namespace Tests\Feature\Product;

use App\Models\MembershipPlan;
use App\Models\Product;
use App\Models\ProductPlanPrice;
use App\Models\Role;
use App\Models\User;
use App\Support\Membership\DefaultPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The admin's Main Products table prices per membership plan.
 *
 * `price_vip`, `price_reseller` and `price_agent` stopped being serialised when
 * pricing moved to plans, but the list endpoint never eager-loaded `planPrices`
 * either — so the table had nothing to render and showed a dash and NaN% for
 * every tier below Public.
 */
class MainProductPlanPricesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
    }

    private function pricedProduct(): Product
    {
        $product = Product::factory()->create(['price_modal' => 48509, 'price_member' => 97018]);

        foreach (MembershipPlan::where('is_active', true)->get() as $plan) {
            ProductPlanPrice::create([
                'product_id' => $product->id,
                'membership_plan_id' => $plan->id,
                'price' => $plan->is_default ? 97018 : 90000,
                'margin_percent' => $plan->is_default ? 100 : 85,
                'margin_flat' => 0,
                'is_manual' => false,
            ]);
        }

        return $product;
    }

    public function test_the_product_list_carries_a_price_for_every_plan(): void
    {
        $product = $this->pricedProduct();

        $row = $this->getJson('/api/v1/products')
            ->assertOk()
            ->json('data.data.0');

        $this->assertSame($product->id, $row['id']);

        $prices = collect($row['prices']);

        $this->assertCount(MembershipPlan::where('is_active', true)->count(), $prices);

        $default = $prices->firstWhere('membership_plan_id', DefaultPlan::id());

        $this->assertSame(97018, $default['price']);
        $this->assertTrue($default['is_default']);
        $this->assertNotNull($default['plan_name']);
        $this->assertNotNull($default['plan_code']);
    }

    public function test_a_single_product_read_carries_them_too(): void
    {
        $product = $this->pricedProduct();

        $prices = $this->getJson("/api/v1/products/{$product->id}")
            ->assertOk()
            ->json('data.prices');

        $this->assertNotEmpty($prices);
    }

    /**
     * A product priced before a plan existed simply has fewer rows — the table
     * must show what is there rather than inventing a tier.
     */
    public function test_an_unpriced_plan_is_absent_rather_than_zero(): void
    {
        $product = Product::factory()->create(['price_modal' => 1000, 'price_member' => 1200]);

        ProductPlanPrice::create([
            'product_id' => $product->id,
            'membership_plan_id' => DefaultPlan::id(),
            'price' => 1200,
            'margin_percent' => 20,
            'margin_flat' => 0,
            'is_manual' => false,
        ]);

        $prices = $this->getJson('/api/v1/products')->json('data.data.0.prices');

        $this->assertCount(1, $prices);
        $this->assertSame(1200, $prices[0]['price']);
    }
}
