<?php

namespace Tests\Feature\Auth;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A refresh token must not be an API session.
 *
 * `auth:sanctum` on its own accepts **any** unexpired personal access token,
 * whatever it was minted for. Without `abilities:access-api` the 30-day
 * `refresh_token` — which the admin panel keeps in a JavaScript-readable
 * cookie — was a full month-long admin session that surviving a password change
 * did not revoke. These tests are the guard on that.
 */
class TokenAbilityTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $role = Role::factory()->create(['name' => 'Admin']);

        return User::factory()->create(['role_id' => $role->id]);
    }

    private function bearer(string $token): array
    {
        return ['Authorization' => 'Bearer '.$token];
    }

    public function test_an_access_token_reaches_a_protected_route(): void
    {
        $token = $this->admin()->createToken('access_token', ['access-api'])->plainTextToken;

        $this->getJson('/api/v1/user', $this->bearer($token))->assertOk();
    }

    public function test_a_refresh_token_is_refused_on_a_protected_route(): void
    {
        $token = $this->admin()->createToken('refresh_token', ['issue-access-token'])->plainTextToken;

        $this->getJson('/api/v1/user', $this->bearer($token))->assertForbidden();
    }

    public function test_a_refresh_token_is_refused_on_an_admin_route(): void
    {
        $token = $this->admin()->createToken('refresh_token', ['issue-access-token'])->plainTextToken;

        $this->getJson('/api/v1/activity-logs', $this->bearer($token))->assertForbidden();
    }

    public function test_a_refresh_token_still_exchanges_for_a_new_pair(): void
    {
        // The one thing it IS for must keep working.
        $token = $this->admin()->createToken('refresh_token', ['issue-access-token'])->plainTextToken;

        $this->postJson('/api/v1/auth/refresh', ['refresh_token' => $token])->assertOk();
    }

    public function test_a_refresh_token_cannot_log_out(): void
    {
        $token = $this->admin()->createToken('refresh_token', ['issue-access-token'])->plainTextToken;

        $this->postJson('/api/v1/auth/logout', [], $this->bearer($token))->assertForbidden();
    }

    public function test_logging_out_revokes_the_refresh_token_too(): void
    {
        $user = $this->admin();
        $access = $user->createToken('access_token', ['access-api'])->plainTextToken;
        $user->createToken('refresh_token', ['issue-access-token']);

        $this->postJson('/api/v1/auth/logout', [], $this->bearer($access))->assertOk();

        // A logout that keeps the 30-day credential closes the 60-minute door
        // and leaves the month open, so the assertion is on what is left behind.
        $this->assertSame(0, $user->tokens()->count(), 'Logout must not leave a refresh token behind.');
    }
}
