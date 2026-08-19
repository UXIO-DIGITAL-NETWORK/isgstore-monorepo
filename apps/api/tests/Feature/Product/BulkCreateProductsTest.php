<?php

namespace Tests\Feature\Product;

use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BulkCreateProductsTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    public function test_creates_many_products_with_derived_prices_and_mappings(): void
    {
        $this->actingAsAdmin();
        $category = Category::factory()->create();
        $supplier = Supplier::factory()->create();

        $this->postJson('/api/v1/products/bulk-create', [
            'supplier_id' => $supplier->id,
            'category_id' => $category->id,
            'items' => [
                ['code' => 'ML5', 'name' => 'Mobile Legends 5 Diamond', 'cost' => 1000],
                ['code' => 'ML10', 'name' => 'Mobile Legends 10 Diamond', 'cost' => 2000],
            ],
        ])->assertCreated()->assertJsonPath('data.created', 2);

        // Prices derived from cost: member = ceil(1000 * 1.2) = 1200.
        $this->assertDatabaseHas('products', ['code' => 'ML5', 'price_member' => 1200]);
        $this->assertDatabaseHas('supplier_products', [
            'supplier_id' => $supplier->id,
            'buyer_sku_code' => 'ML10',
            'price' => 2000,
        ]);
    }

    public function test_skips_duplicate_codes_without_aborting(): void
    {
        $this->actingAsAdmin();
        $category = Category::factory()->create();
        $supplier = Supplier::factory()->create();
        Product::factory()->create(['code' => 'TAKEN', 'category_id' => $category->id]);

        $this->postJson('/api/v1/products/bulk-create', [
            'supplier_id' => $supplier->id,
            'category_id' => $category->id,
            'items' => [
                ['code' => 'TAKEN', 'name' => 'Dup', 'cost' => 1000],
                ['code' => 'FRESH', 'name' => 'Fresh', 'cost' => 1000],
            ],
        ])->assertCreated()
            ->assertJsonPath('data.created', 1)
            ->assertJsonPath('data.skipped.0.code', 'TAKEN');

        $this->assertDatabaseHas('products', ['code' => 'FRESH']);
    }

    public function test_validates_supplier_category_and_items(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/v1/products/bulk-create', ['items' => []])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['supplier_id', 'category_id', 'items']);
    }
}
