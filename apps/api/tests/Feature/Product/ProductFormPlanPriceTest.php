<?php

declare(strict_types=1);

namespace Tests\Feature\Product;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPlanPrice;
use App\Models\Role;
use App\Models\User;
use App\Support\Membership\DefaultPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The two product forms write the price customers are actually charged from.
 *
 * Both used to write only `products.price_member` — the denormalised copy kept
 * for sorting and filtering — and leave `product_plan_prices` alone. That is how
 * a product came to show one price in the admin list while the storefront
 * charged another, and how the deploy's `pricing:verify` gate came to fail.
 */
class ProductFormPlanPriceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
    }

    /** @return array<string,mixed> */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'category_id' => Category::factory()->create()->id,
            'name' => 'MLBB - 86 Diamond',
            'code' => 'MLBB-86',
            'price_modal' => 10000,
            'price_member' => 13500,
            'price_vip' => 13000,
            'price_reseller' => 12500,
            'price_agent' => 12200,
            'status' => true,
        ], $overrides);
    }

    private function defaultPlanPrice(Product $product): ?int
    {
        $price = ProductPlanPrice::query()
            ->where('product_id', $product->id)
            ->where('membership_plan_id', DefaultPlan::id())
            ->value('price');

        return $price === null ? null : (int) $price;
    }

    public function test_creating_a_product_prices_the_default_plan(): void
    {
        $this->postJson('/api/v1/products', $this->payload())->assertCreated();

        $product = Product::where('code', 'MLBB-86')->firstOrFail();

        // Without a row here the storefront can only fall back to `price_member`
        // and warn about it — the alarm for "the backfill never ran".
        $this->assertSame(13500, $this->defaultPlanPrice($product));
        $this->assertSame(13500, (int) $product->price_member);

        $this->artisan('pricing:verify')->assertSuccessful();
    }

    public function test_editing_a_product_moves_the_price_it_is_billed_at(): void
    {
        $this->postJson('/api/v1/products', $this->payload())->assertCreated();
        $product = Product::where('code', 'MLBB-86')->firstOrFail();

        $this->putJson("/api/v1/products/{$product->id}", $this->payload(['price_member' => 15000]))
            ->assertOk();

        // The plan row is the one `PlanPrice` quotes; the column is only its
        // mirror, so both have to move or the storefront keeps the old price.
        $this->assertSame(15000, $this->defaultPlanPrice($product));
        $this->assertSame(15000, (int) $product->fresh()->price_member);

        $this->artisan('pricing:verify')->assertSuccessful();
    }
}
