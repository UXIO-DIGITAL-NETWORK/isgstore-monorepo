<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ServerCategoryCrudTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    public function test_server_categories_require_authentication(): void
    {
        $this->getJson('/api/v1/server-categories')->assertUnauthorized();
    }

    public function test_can_create_list_update_and_delete_a_server_category(): void
    {
        $this->actingAsAdmin();
        $category = Category::factory()->create();

        $created = $this->postJson('/api/v1/server-categories', [
            'category_id' => $category->id,
            'name' => 'Asia',
        ])->assertCreated()
            ->assertJsonPath('data.name', 'Asia')
            ->assertJsonPath('data.category.id', $category->id)
            ->json('data');

        $this->getJson("/api/v1/server-categories?category_id={$category->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.data');

        $this->putJson("/api/v1/server-categories/{$created['id']}", [
            'category_id' => $category->id,
            'name' => 'Southeast Asia',
        ])->assertOk()->assertJsonPath('data.name', 'Southeast Asia');

        $this->deleteJson("/api/v1/server-categories/{$created['id']}")->assertOk();
        $this->assertDatabaseCount('server_categories', 0);
    }
}
