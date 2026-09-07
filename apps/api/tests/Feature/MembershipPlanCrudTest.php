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
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
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

        // Stored as locale-keyed JSON under the 'id' key. Looked up by code,
        // not by `first()`: the free default plan the migration inserts is now
        // the lowest-id row in every database.
        $this->assertSame(['id' => 'Gold'], MembershipPlan::where('code', 'gold')->first()->name);
    }

    public function test_admin_can_create_a_lifetime_plan(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/v1/membership-plans', [
            'code' => 'lifetime',
            'name' => 'Lifetime',
            'price' => 300000,
            'duration_days' => null,
        ])->assertCreated()
            // NULL, not 0 — the admin table branches on it to print "Lifetime",
            // and a 0 would read as a plan that expires immediately.
            ->assertJsonPath('data.duration_days', null);

        $this->assertNull(MembershipPlan::first()->duration_days);
    }

    public function test_a_duration_must_still_be_at_least_a_day_when_given(): void
    {
        $this->actingAsAdmin();

        // Nullable is not "anything goes": 0 days would be swept by
        // memberships:expire on the next run.
        $this->postJson('/api/v1/membership-plans', [
            'code' => 'zero',
            'name' => 'Zero',
            'price' => 1000,
            'duration_days' => 0,
        ])->assertStatus(422)->assertJsonValidationErrors('duration_days');
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
        // Soft delete: a hard delete would cascade away the plan's price rows,
        // which past invoices and repricing history point at.
        $this->assertSoftDeleted('membership_plans', ['id' => $plan->id]);
    }

    public function test_the_default_plan_cannot_be_deleted(): void
    {
        // Every price resolution falls through to it, guests included. Deleting
        // it would not degrade the storefront — it would stop it quoting at all.
        $this->actingAsAdmin();

        $default = MembershipPlan::where('is_default', true)->firstOrFail();

        $this->deleteJson("/api/v1/membership-plans/{$default->id}")->assertStatus(422);
        $this->assertNotSoftDeleted('membership_plans', ['id' => $default->id]);
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
