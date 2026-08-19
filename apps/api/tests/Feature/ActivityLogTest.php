<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ActivityLogTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    public function test_activity_logs_require_authentication(): void
    {
        $this->getJson('/api/v1/activity-logs')->assertUnauthorized();
    }

    public function test_list_includes_the_acting_users_name_and_role(): void
    {
        $this->actingAsAdmin();
        $role = Role::factory()->create(['name' => 'Admin']);
        $actor = User::factory()->create(['name' => 'Dimas Sufyan', 'role_id' => $role->id]);
        ActivityLog::factory()->create(['user_id' => $actor->id, 'message' => 'Created new Category: Mobile Legends']);

        $this->getJson('/api/v1/activity-logs')
            ->assertOk()
            ->assertJsonPath('data.data.0.actor', 'Dimas Sufyan')
            ->assertJsonPath('data.data.0.role', 'Admin')
            ->assertJsonPath('data.data.0.message', 'Created new Category: Mobile Legends');
    }

    public function test_it_excludes_payment_page_roles_but_keeps_admin_storefront_and_guests(): void
    {
        $this->actingAsAdmin();

        $admin = User::factory()->create(['role_id' => Role::factory()->create(['name' => 'Admin'])->id]);
        $member = User::factory()->create(['role_id' => Role::factory()->create(['name' => 'Member'])->id]);
        $paymentAdmin = User::factory()->create(['role_id' => Role::factory()->create(['name' => 'Payment-Admin'])->id]);
        $paymentInternal = User::factory()->create(['role_id' => Role::factory()->create(['name' => 'Payment-Internal'])->id]);

        ActivityLog::factory()->create(['user_id' => $admin->id, 'message' => 'Admin updated Product: MLBB']);
        ActivityLog::factory()->create(['user_id' => $member->id, 'message' => 'User logged in successfully']);
        ActivityLog::factory()->create(['user_id' => null, 'message' => 'Checkout INV-20260819-0001 — Diamonds']); // guest
        ActivityLog::factory()->create(['user_id' => $paymentAdmin->id, 'message' => 'Membuka pembayaran SINV-1 Rp 151050 via QRIS']);
        ActivityLog::factory()->create(['user_id' => $paymentInternal->id, 'message' => 'Finance approved a withdrawal']);

        $messages = collect($this->getJson('/api/v1/activity-logs')->assertOk()->json('data.data'))
            ->pluck('message');

        $this->assertTrue($messages->contains('Admin updated Product: MLBB'));
        $this->assertTrue($messages->contains('User logged in successfully'));
        $this->assertTrue($messages->contains('Checkout INV-20260819-0001 — Diamonds'));
        $this->assertFalse($messages->contains('Membuka pembayaran SINV-1 Rp 151050 via QRIS'));
        $this->assertFalse($messages->contains('Finance approved a withdrawal'));
    }

    public function test_it_derives_a_display_type_for_untyped_rows(): void
    {
        $this->actingAsAdmin();
        $admin = User::factory()->create(['role_id' => Role::factory()->create(['name' => 'Admin'])->id]);

        ActivityLog::factory()->create(['user_id' => $admin->id, 'type' => null, 'message' => 'User logged in successfully']);

        $this->getJson('/api/v1/activity-logs')
            ->assertOk()
            ->assertJsonPath('data.data.0.type', 'login');
    }
}
