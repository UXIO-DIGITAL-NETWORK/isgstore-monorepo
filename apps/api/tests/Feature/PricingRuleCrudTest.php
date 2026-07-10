<?php

namespace Tests\Feature;

use App\Models\PricingRule;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PricingRuleCrudTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    public function test_pricing_rules_require_authentication(): void
    {
        $this->getJson('/api/v1/pricing-rules')->assertUnauthorized();
    }

    public function test_can_create_and_list_pricing_rules(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/v1/pricing-rules', [
            'category_id' => null,
            'role' => 'member',
            'markup_percent' => 17.5,
            'markup_flat' => 100,
        ])->assertCreated();

        $this->getJson('/api/v1/pricing-rules')
            ->assertOk()
            ->assertJsonPath('data.0.role', 'member');
    }

    public function test_validation_rejects_bad_role_and_negative_markup(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/v1/pricing-rules', [
            'role' => 'superadmin',
            'markup_percent' => -5,
            'markup_flat' => -100,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['role', 'markup_percent', 'markup_flat']);
    }

    public function test_duplicate_role_scope_is_rejected(): void
    {
        $this->actingAsAdmin();
        PricingRule::factory()->create(['role' => 'member']);

        $this->postJson('/api/v1/pricing-rules', [
            'category_id' => null,
            'role' => 'member',
            'markup_percent' => 10,
            'markup_flat' => 0,
        ])->assertUnprocessable();
    }

    public function test_can_update_and_delete_rule(): void
    {
        $this->actingAsAdmin();
        $rule = PricingRule::factory()->create(['role' => 'member', 'markup_percent' => 20]);

        $this->putJson("/api/v1/pricing-rules/{$rule->id}", [
            'category_id' => null,
            'role' => 'member',
            'markup_percent' => 25,
            'markup_flat' => 0,
        ])->assertOk();

        $this->assertSame(25.0, (float) $rule->fresh()->markup_percent);

        $this->deleteJson("/api/v1/pricing-rules/{$rule->id}")->assertOk();
        $this->assertDatabaseCount('pricing_rules', 0);
    }
}
