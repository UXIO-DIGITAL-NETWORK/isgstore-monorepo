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
            'template_code' => 'ml-diamonds-tpl',
        ])->assertCreated()
            ->assertJsonPath('data.template_code', 'ml-diamonds-tpl')
            ->assertJsonPath('data.category.id', $category->id)
            ->assertJsonPath('data.supplier.id', $supplier->id)
            ->json('data');

        $this->getJson("/api/v1/supplier-categories?supplier_id={$supplier->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.data');

        $this->putJson("/api/v1/supplier-categories/{$created['id']}", [
            'category_id' => $category->id,
            'supplier_id' => $supplier->id,
            'template_code' => 'ml-diamonds-tpl-v2',
        ])->assertOk()->assertJsonPath('data.template_code', 'ml-diamonds-tpl-v2');

        $this->deleteJson("/api/v1/supplier-categories/{$created['id']}")->assertOk();
        $this->assertDatabaseCount('supplier_categories', 0);
    }
}
