<?php

declare(strict_types=1);

namespace Tests\Feature\Product;

use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use App\Support\Points\PointRules;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Loyalty points are configured per product, on the product form.
 *
 * `PointRules` has always preferred a product's own `point_percent`/`point_flat`
 * over the global `points` settings, but nothing wrote those columns — no
 * request validated them, so every SKU silently fell through to the global
 * percentage. These tests pin the write path that closes that gap, including
 * the distinction the form depends on: a blank field means "use the global
 * fallback", an explicit 0 means "this SKU earns nothing".
 */
class ProductPointRulesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
    }

    /** @return array<string, mixed> */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'category_id' => Category::factory()->create()->id,
            'name' => 'Mobile Legends 86 Diamond',
            'code' => 'ML86-'.fake()->unique()->numberBetween(1000, 9999),
            'price_modal' => 10000,
            'price_member' => 12000,
            'price_vip' => 11500,
            'price_reseller' => 11000,
            'price_agent' => 10500,
            'status' => true,
        ], $overrides);
    }

    public function test_product_can_be_created_with_its_own_point_rules(): void
    {
        $response = $this->postJson('/api/v1/products', $this->payload([
            'point_percent' => 2.5,
            'point_flat' => 50,
        ]))->assertCreated();

        $this->assertSame(2.5, $response->json('data.point_percent'));
        $this->assertSame(50, $response->json('data.point_flat'));
    }

    public function test_point_rules_can_be_edited_and_cleared(): void
    {
        $product = Product::factory()->create(['point_percent' => 5, 'point_flat' => 100]);

        $this->putJson("/api/v1/products/{$product->id}", $this->payload([
            'code' => $product->code,
            'point_percent' => '',
            'point_flat' => '',
        ]))->assertOk();

        $product->refresh();

        $this->assertNull($product->point_percent);
        $this->assertNull($product->point_flat);
    }

    public function test_a_percentage_above_one_hundred_is_rejected(): void
    {
        $this->postJson('/api/v1/products', $this->payload(['point_percent' => 120]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('point_percent');
    }

    public function test_the_products_own_rule_wins_over_the_global_setting(): void
    {
        Setting::create([
            'group' => PointRules::GROUP,
            'key' => PointRules::KEY_PERCENT,
            'value' => '1',
            'type' => 'number',
            'is_public' => true,
        ]);

        $configured = Product::factory()->create(['point_percent' => 10, 'point_flat' => 5]);
        $unconfigured = Product::factory()->create(['point_percent' => null, 'point_flat' => null]);

        // 10% of 10.000 plus the 5-point sweetener, against the global 1%.
        $this->assertSame(1005, PointRules::earnedFor($configured, 10000));
        $this->assertSame(100, PointRules::earnedFor($unconfigured, 10000));
    }

    /**
     * The one case a nullable column has to keep separate: an admin who types 0
     * has decided this SKU earns nothing, and must not be handed the global
     * percentage instead.
     */
    public function test_an_explicit_zero_is_not_treated_as_unconfigured(): void
    {
        Setting::create([
            'group' => PointRules::GROUP,
            'key' => PointRules::KEY_PERCENT,
            'value' => '1',
            'type' => 'number',
            'is_public' => true,
        ]);

        $response = $this->postJson('/api/v1/products', $this->payload([
            'point_percent' => 0,
            'point_flat' => 0,
        ]))->assertCreated();

        $product = Product::find($response->json('data.id'));

        $this->assertSame(0, PointRules::earnedFor($product, 10000));
    }
}
