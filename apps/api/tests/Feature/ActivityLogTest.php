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
}
