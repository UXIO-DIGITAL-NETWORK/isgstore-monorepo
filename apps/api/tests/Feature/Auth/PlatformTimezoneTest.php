<?php

namespace Tests\Feature\Auth;

use App\Models\Role;
use App\Models\User;
use App\Support\DateTime\Wib;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * One wall clock for the whole platform: WIB.
 *
 * Every screen renders WIB and every report window is bucketed on that same day
 * boundary, so `users.timezone` must not be whatever zone a browser happened to
 * report — the clock and the figures printed beside it would disagree.
 */
class PlatformTimezoneTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'uxiolabsJaya123';

    private function member(string $timezone = 'Europe/Berlin'): User
    {
        $role = Role::factory()->create(['name' => 'Member']);

        return User::factory()->withoutTwoFactor()->create([
            'role_id' => $role->id,
            'email' => 'member@example.test',
            'password' => Hash::make(self::PASSWORD),
            'timezone' => $timezone,
        ]);
    }

    public function test_login_corrects_a_stale_zone_to_the_platform_zone(): void
    {
        $user = $this->member();

        $this->postJson('/api/v1/auth/login', [
            'email' => 'member@example.test',
            'password' => self::PASSWORD,
            'timezone' => 'Europe/Berlin',
        ])->assertOk();

        $this->assertSame(Wib::TZ, $user->fresh()->timezone);
    }

    public function test_the_sync_endpoint_normalises_instead_of_obeying_its_payload(): void
    {
        // The endpoint survives for older clients; the zone it sends does not.
        $user = $this->member();
        Sanctum::actingAs($user, ['access-api']);

        $this->patchJson('/api/v1/users/sync-timezone', ['timezone' => 'Europe/Berlin'])
            ->assertOk()
            ->assertJsonPath('data.timezone', Wib::TZ);

        $this->assertSame(Wib::TZ, $user->fresh()->timezone);
    }

    public function test_registering_stores_the_platform_zone_whatever_was_sent(): void
    {
        Role::factory()->create(['name' => 'Member']);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Budi Santoso',
            'username' => 'budisan',
            'email' => 'budi@example.com',
            'phone' => '628123456789',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'timezone' => 'Europe/Berlin',
        ])->assertCreated();

        $this->assertSame(Wib::TZ, User::firstWhere('email', 'budi@example.com')->timezone);
    }

    public function test_the_user_payload_reports_the_platform_zone_after_sign_in(): void
    {
        // What the panels actually read back, so a stale account cannot keep
        // showing its own zone on a new device.
        $this->member();

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => 'member@example.test',
            'password' => self::PASSWORD,
        ])->assertOk()->json('data.access_token');

        $this->getJson('/api/v1/user', ['Authorization' => "Bearer {$token}"])
            ->assertOk()
            ->assertJsonPath('data.timezone', Wib::TZ);
    }
}
