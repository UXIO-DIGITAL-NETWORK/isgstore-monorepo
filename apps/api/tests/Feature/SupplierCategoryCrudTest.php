<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SupplierCategoryCrudTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    public function test_supplier_categories_require_authentication(): void
    {
        $this->getJson('/api/v1/supplier-categories')->assertUnauthorized();
    }

    public function test_can_create_list_update_and_delete_a_supplier_category(): void
    {
        $this->actingAsAdmin();
        $category = Category::factory()->create();
        $supplier = Supplier::factory()->create();

        $created = $this->postJson('/api/v1/supplier-categories', [
            'category_id' => $category->id,
            'supplier_id' => $supplier->id,
            'provider_category' => 'Mobile Legends',
        ])->assertCreated()
            ->assertJsonPath('data.provider_category', 'Mobile Legends')
            ->assertJsonPath('data.category.id', $category->id)
            ->assertJsonPath('data.supplier.id', $supplier->id)
            ->json('data');

        $this->getJson("/api/v1/supplier-categories?supplier_id={$supplier->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.data');

        $this->putJson("/api/v1/supplier-categories/{$created['id']}", [
            'category_id' => $category->id,
            'supplier_id' => $supplier->id,
            'provider_category' => 'Mobile Legends Global',
        ])->assertOk()->assertJsonPath('data.provider_category', 'Mobile Legends Global');

        $this->deleteJson("/api/v1/supplier-categories/{$created['id']}")->assertOk();
        $this->assertDatabaseCount('supplier_categories', 0);
    }

    public function test_provider_category_is_unique_per_supplier(): void
    {
        $this->actingAsAdmin();
        $supplier = Supplier::factory()->create();

        $this->postJson('/api/v1/supplier-categories', [
            'category_id' => Category::factory()->create()->id,
            'supplier_id' => $supplier->id,
            'provider_category' => 'Mobile Legends',
        ])->assertCreated();

        // The same provider kategori cannot resolve to a second category of ours —
        // promote reads this mapping in one direction and needs one answer.
        $this->postJson('/api/v1/supplier-categories', [
            'category_id' => Category::factory()->create()->id,
            'supplier_id' => $supplier->id,
            'provider_category' => 'Mobile Legends',
        ])->assertStatus(422)->assertJsonValidationErrors('provider_category');
    }

    public function test_the_same_provider_category_may_be_reused_by_another_supplier(): void
    {
        $this->actingAsAdmin();
        $category = Category::factory()->create();

        foreach ([Supplier::factory()->create(), Supplier::factory()->create()] as $supplier) {
            $this->postJson('/api/v1/supplier-categories', [
                'category_id' => $category->id,
                'supplier_id' => $supplier->id,
                'provider_category' => 'Mobile Legends',
            ])->assertCreated();
        }

        $this->assertDatabaseCount('supplier_categories', 2);
    }
}
