<?php

namespace Tests\Feature;

use App\Models\PricingRule;
use App\Models\Role;
use App\Models\User;
use App\Support\Membership\DefaultPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PricingRuleCrudTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
    }

    public function test_pricing_rules_require_authentication(): void
    {
        $this->getJson('/api/v1/pricing-rules')->assertUnauthorized();
    }

    public function test_can_create_and_list_pricing_rules(): void
    {
        $this->actingAsAdmin();
        $plan = DefaultPlan::id();

        $this->postJson('/api/v1/pricing-rules', [
            'category_id' => null,
            'membership_plan_id' => $plan,
            'markup_percent' => 17.5,
            'markup_flat' => 100,
        ])->assertCreated();

        $this->getJson('/api/v1/pricing-rules')
            ->assertOk()
            ->assertJsonPath('data.0.membership_plan_id', $plan);
    }

    public function test_a_rule_with_no_plan_applies_to_every_plan(): void
    {
        // The rung that keeps an admin-invented tier priced rather than
        // unpriced. Null is a real value here, not a missing one.
        $this->actingAsAdmin();

        $this->postJson('/api/v1/pricing-rules', [
            'category_id' => null,
            'membership_plan_id' => null,
            'markup_percent' => 30,
            'markup_flat' => 0,
        ])->assertCreated();

        $this->assertDatabaseHas('pricing_rules', ['membership_plan_id' => null, 'markup_percent' => 30]);
    }

    public function test_validation_rejects_an_unknown_plan_and_negative_markup(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/v1/pricing-rules', [
            'membership_plan_id' => 99999,
            'markup_percent' => -5,
            'markup_flat' => -100,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['membership_plan_id', 'markup_percent', 'markup_flat']);
    }

    public function test_duplicate_scope_is_rejected(): void
    {
        $this->actingAsAdmin();
        PricingRule::factory()->create(['membership_plan_id' => DefaultPlan::id()]);

        $this->postJson('/api/v1/pricing-rules', [
            'category_id' => null,
            'membership_plan_id' => DefaultPlan::id(),
            'markup_percent' => 10,
            'markup_flat' => 0,
        ])->assertUnprocessable();
    }

    public function test_a_duplicate_all_plans_rule_is_rejected_too(): void
    {
        // Neither `Rule::unique` nor the DB index catches this: a nullable
        // field skips its own rules when null, and MySQL treats NULLs as
        // distinct. Two "all categories, all plans" rules is the pair most
        // likely to be created by accident.
        $this->actingAsAdmin();
        PricingRule::factory()->create(['category_id' => null, 'membership_plan_id' => null]);

        $this->postJson('/api/v1/pricing-rules', [
            'category_id' => null,
            'membership_plan_id' => null,
            'markup_percent' => 10,
            'markup_flat' => 0,
        ])->assertUnprocessable();
    }

    public function test_can_update_and_delete_rule(): void
    {
        $this->actingAsAdmin();
        $rule = PricingRule::factory()->create(['membership_plan_id' => DefaultPlan::id(), 'markup_percent' => 20]);

        $this->putJson("/api/v1/pricing-rules/{$rule->id}", [
            'category_id' => null,
            'membership_plan_id' => DefaultPlan::id(),
            'markup_percent' => 25,
            'markup_flat' => 0,
        ])->assertOk();

        $this->assertSame(25.0, (float) $rule->fresh()->markup_percent);

        $this->deleteJson("/api/v1/pricing-rules/{$rule->id}")->assertOk();
        $this->assertDatabaseCount('pricing_rules', 0);
    }
}
