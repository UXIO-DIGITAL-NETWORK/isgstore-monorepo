<?php

namespace Tests\Feature\Product;

use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BulkProviderProductActionsTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
    }

    private function providerFor(Supplier $supplier, int $modal = 10000): SupplierProduct
    {
        $product = Product::factory()->create([
            'category_id' => Category::factory()->create()->id,
            'price_modal' => $modal,
            'price_member' => (int) ($modal * 1.2),
        ]);

        return SupplierProduct::factory()->create([
            'product_id' => $product->id,
            'supplier_id' => $supplier->id,
            'price' => $modal,
        ]);
    }

    public function test_bulk_lock_price_locks_the_whole_selection(): void
    {
        $this->actingAsAdmin();
        $supplier = Supplier::factory()->create(['is_system' => false]);
        $a = $this->providerFor($supplier);
        $b = $this->providerFor($supplier);

        $this->postJson('/api/v1/supplier-products/bulk/lock-price', ['ids' => [$a->id, $b->id], 'locked' => true])
            ->assertOk()
            ->assertJsonPath('data.updated', 2);

        $this->assertDatabaseHas('supplier_products', ['id' => $a->id, 'is_price_locked' => true]);
        $this->assertDatabaseHas('supplier_products', ['id' => $b->id, 'is_price_locked' => true]);
    }

    public function test_bulk_set_margin_recomputes_every_product(): void
    {
        $this->actingAsAdmin();
        $supplier = Supplier::factory()->create(['is_system' => false]);
        $a = $this->providerFor($supplier, 10000);
        $b = $this->providerFor($supplier, 20000);

        $this->postJson('/api/v1/supplier-products/bulk/profit-margin', [
            'ids' => [$a->id, $b->id],
            'margin_member' => 1.0, // +1%
        ])->assertOk()->assertJsonPath('data.updated', 2);

        $this->assertDatabaseHas('products', ['id' => $a->product_id, 'price_member' => 10100]);
        $this->assertDatabaseHas('products', ['id' => $b->product_id, 'price_member' => 20200]);
    }

    public function test_bulk_delete_skips_system_rows(): void
    {
        $this->actingAsAdmin();
        $normal = $this->providerFor(Supplier::factory()->create(['is_system' => false]));
        $system = $this->providerFor(Supplier::factory()->create(['is_system' => true]));

        $this->postJson('/api/v1/supplier-products/bulk/delete', ['ids' => [$normal->id, $system->id]])
            ->assertOk()
            ->assertJsonPath('data.deleted', 1)
            ->assertJsonPath('data.skipped.0.id', $system->id);

        $this->assertDatabaseMissing('supplier_products', ['id' => $normal->id]);
        $this->assertDatabaseHas('supplier_products', ['id' => $system->id]);
    }

    public function test_bulk_endpoints_validate_ids(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/v1/supplier-products/bulk/delete', ['ids' => []])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['ids']);
    }
}
