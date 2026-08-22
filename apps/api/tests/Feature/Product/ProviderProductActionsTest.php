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

class ProviderProductActionsTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    private function providerFor(Supplier $supplier): SupplierProduct
    {
        $product = Product::factory()->create([
            'category_id' => Category::factory()->create()->id,
            'price_modal' => 10000,
            'price_member' => 12000,
            'price_vip' => 11500,
            'price_reseller' => 11000,
            'price_agent' => 10500,
        ]);

        return SupplierProduct::factory()->create([
            'product_id' => $product->id,
            'supplier_id' => $supplier->id,
            'price' => 10000,
        ]);
    }

    public function test_index_exposes_system_flag_and_filters_by_supplier(): void
    {
        $this->actingAsAdmin();
        $system = Supplier::factory()->create(['is_system' => true]);
        $uxiotopup = Supplier::factory()->create(['is_system' => false]);
        $this->providerFor($system);
        $this->providerFor($uxiotopup);

        $this->getJson("/api/v1/supplier-products?supplier_id={$system->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.is_system', true);
    }

    public function test_lock_price_toggles_the_flag(): void
    {
        $this->actingAsAdmin();
        $provider = $this->providerFor(Supplier::factory()->create(['is_system' => false]));

        $this->postJson("/api/v1/supplier-products/{$provider->id}/lock-price", ['locked' => true])
            ->assertOk()
            ->assertJsonPath('data.is_price_locked', true);

        $this->assertDatabaseHas('supplier_products', ['id' => $provider->id, 'is_price_locked' => true]);
    }

    public function test_set_margin_recomputes_product_prices(): void
    {
        $this->actingAsAdmin();
        $provider = $this->providerFor(Supplier::factory()->create(['is_system' => false]));

        $this->postJson("/api/v1/supplier-products/{$provider->id}/profit-margin", [
            'margin_member' => 1.0,   // +1% of 10000 → 10100
            'margin_vip' => 2.5,      // → 10250
        ])->assertOk();

        $this->assertDatabaseHas('products', [
            'id' => $provider->product_id,
            'price_member' => 10100,
            'price_vip' => 10250,
        ]);
    }

    public function test_system_provider_cannot_be_deleted(): void
    {
        $this->actingAsAdmin();
        $provider = $this->providerFor(Supplier::factory()->create(['is_system' => true]));

        $this->deleteJson("/api/v1/supplier-products/{$provider->id}")->assertForbidden();
        $this->assertDatabaseHas('supplier_products', ['id' => $provider->id]);
    }

    public function test_non_system_provider_can_be_deleted(): void
    {
        $this->actingAsAdmin();
        $provider = $this->providerFor(Supplier::factory()->create(['is_system' => false]));

        $this->deleteJson("/api/v1/supplier-products/{$provider->id}")->assertOk();
        $this->assertDatabaseMissing('supplier_products', ['id' => $provider->id]);
    }
}
