<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\CategoryType;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CategoryCrudTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    private function actingAsMember(): void
    {
        $role = Role::factory()->create(['name' => 'Member']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    public function test_categories_require_authentication(): void
    {
        $this->getJson('/api/v1/categories')->assertUnauthorized();
    }

    public function test_categories_are_forbidden_for_non_admin_roles(): void
    {
        $this->actingAsMember();

        $this->getJson('/api/v1/categories')->assertForbidden();
    }

    public function test_can_create_and_list_category_with_seo_and_order_form_fields(): void
    {
        $this->actingAsAdmin();
        $type = CategoryType::factory()->create();

        $this->postJson('/api/v1/categories', [
            'type_id' => $type->id,
            'name' => 'Mobile Legends',
            'sub_name' => 'Diamonds',
            'code' => 'ml-diamonds',
            'slug' => 'mobile-legends-diamonds',
            'uid_parser' => 'ML UID+Zone Parser',
            'region' => 'Southeast Asia',
            'status' => true,
            'order_form_fields' => [
                ['key' => 'user_id', 'label' => 'User ID', 'required' => true],
                ['key' => 'zone_id', 'label' => 'Zone ID', 'required' => true],
            ],
            'meta_title' => 'Top Up ML Diamonds',
            'meta_description' => 'Cheapest ML diamonds top up.',
            'meta_keywords' => ['top up ml', 'diamond ml'],
            'meta_robots' => 'Index, Follow',
        ])->assertCreated()
            ->assertJsonPath('data.name', 'Mobile Legends')
            ->assertJsonPath('data.slug', 'mobile-legends-diamonds')
            ->assertJsonPath('data.order_form_fields.0.key', 'user_id')
            ->assertJsonPath('data.meta_keywords.1', 'diamond ml');

        $this->getJson('/api/v1/categories?search=Mobile&per_page=5')
            ->assertOk()
            ->assertJsonPath('data.data.0.code', 'ml-diamonds')
            ->assertJsonPath('data.meta.per_page', 5);
    }

    public function test_validation_rejects_duplicate_code_and_slug(): void
    {
        $this->actingAsAdmin();
        $type = CategoryType::factory()->create();
        Category::factory()->create(['code' => 'taken-code', 'slug' => 'taken-slug', 'type_id' => $type->id]);

        $this->postJson('/api/v1/categories', [
            'type_id' => $type->id,
            'name' => 'Duplicate',
            'code' => 'taken-code',
            'slug' => 'taken-slug',
            'status' => true,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['code', 'slug']);
    }

    public function test_can_update_and_delete_category(): void
    {
        $this->actingAsAdmin();
        $type = CategoryType::factory()->create();
        $category = Category::factory()->create(['type_id' => $type->id, 'name' => 'Old Name']);

        $this->putJson("/api/v1/categories/{$category->id}", [
            'type_id' => $type->id,
            'name' => 'New Name',
            'code' => $category->code,
            'status' => false,
        ])->assertOk()
            ->assertJsonPath('data.name', 'New Name')
            ->assertJsonPath('data.status', false);

        $this->deleteJson("/api/v1/categories/{$category->id}")->assertOk();
        $this->assertDatabaseCount('categories', 0);
    }

    public function test_list_filters_by_type_id(): void
    {
        $this->actingAsAdmin();
        $typeA = CategoryType::factory()->create();
        $typeB = CategoryType::factory()->create();
        Category::factory()->create(['type_id' => $typeA->id, 'name' => 'In Type A']);
        Category::factory()->create(['type_id' => $typeB->id, 'name' => 'In Type B']);

        $this->getJson("/api/v1/categories?type_id={$typeA->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.name', 'In Type A');
    }
}
