<?php

namespace Tests\Feature;

use App\Models\CategoryType;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CategoryTypeCrudTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
    }

    public function test_category_types_require_authentication(): void
    {
        $this->getJson('/api/v1/category-types')->assertUnauthorized();
    }

    public function test_can_create_list_update_and_delete_a_category_type(): void
    {
        $this->actingAsAdmin();

        $created = $this->postJson('/api/v1/category-types', ['name' => 'Mobile Game', 'status' => true])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Mobile Game')
            ->json('data');

        $this->getJson('/api/v1/category-types?search=Mobile')
            ->assertOk()
            ->assertJsonPath('data.data.0.name', 'Mobile Game');

        $this->putJson("/api/v1/category-types/{$created['id']}", ['name' => 'PC Game', 'status' => false])
            ->assertOk()
            ->assertJsonPath('data.name', 'PC Game')
            ->assertJsonPath('data.status', false);

        $this->deleteJson("/api/v1/category-types/{$created['id']}")->assertOk();
        $this->assertDatabaseCount('category_types', 0);
    }

    public function test_validation_requires_name_and_status(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/v1/category-types', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'status']);
    }

    public function test_list_paginates_per_page(): void
    {
        $this->actingAsAdmin();
        CategoryType::factory()->count(3)->create();

        $this->getJson('/api/v1/category-types?per_page=2')
            ->assertOk()
            ->assertJsonCount(2, 'data.data')
            ->assertJsonPath('data.meta.total', 3);
    }
}
