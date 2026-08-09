<?php

namespace Tests\Feature;

use App\Models\MembershipPlan;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MembershipPlanCrudTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    public function test_index_requires_admin(): void
    {
        $this->getJson('/api/v1/membership-plans')->assertUnauthorized();
    }

    public function test_admin_can_create_a_plan_and_name_flattens_on_read(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/v1/membership-plans', [
            'code' => 'gold',
            'name' => 'Gold',
            'benefits' => ['Priority support', '5% discount'],
            'price' => 50000,
            'duration_days' => 30,
        ])->assertCreated()
            ->assertJsonPath('data.name', 'Gold')
            ->assertJsonPath('data.price', 50000)
            ->assertJsonPath('data.benefits.0', 'Priority support');

        // Stored as locale-keyed JSON under the 'id' key.
        $this->assertSame(['id' => 'Gold'], MembershipPlan::first()->name);
    }

    public function test_admin_can_update_and_delete_a_plan(): void
    {
        $this->actingAsAdmin();
        $plan = MembershipPlan::create([
            'code' => 'silver',
            'name' => ['id' => 'Silver'],
            'price' => 20000,
            'duration_days' => 30,
        ]);

        $this->putJson("/api/v1/membership-plans/{$plan->id}", ['price' => 25000])
            ->assertOk()
            ->assertJsonPath('data.price', 25000);

        $this->deleteJson("/api/v1/membership-plans/{$plan->id}")->assertOk();
        $this->assertDatabaseMissing('membership_plans', ['id' => $plan->id]);
    }

    public function test_create_rejects_a_duplicate_code(): void
    {
        $this->actingAsAdmin();
        MembershipPlan::create(['code' => 'gold', 'name' => ['id' => 'Gold'], 'price' => 1, 'duration_days' => 30]);

        $this->postJson('/api/v1/membership-plans', [
            'code' => 'gold',
            'name' => 'Gold 2',
            'price' => 1000,
            'duration_days' => 30,
        ])->assertUnprocessable();
    }
}
