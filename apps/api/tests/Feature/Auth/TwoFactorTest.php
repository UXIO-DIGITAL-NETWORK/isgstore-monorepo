<?php

namespace Tests\Feature\Auth;

use App\Models\Role;
use App\Models\TwoFactorChallenge;
use App\Models\User;
use App\Support\Auth\Base32;
use App\Support\Auth\Totp;
use App\Support\Auth\TwoFactorChallengeToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The second factor, end to end.
 *
 * The maths is pinned against the RFC vectors in Tests\Unit\Support\Auth; this
 * covers the parts that decide whether the feature is actually protective —
 * what the login response gives away, whether a challenge can be replayed or
 * ground down, and whether an admin can be stranded.
 */
class TwoFactorTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'uxiotopupJaya123';

    private function admin(bool $enrolled = false, ?string $secret = null): User
    {
        $role = Role::factory()->create(['name' => 'Admin']);

        return User::factory()->create([
            'role_id' => $role->id,
            'email' => 'admin@example.test',
            'password' => Hash::make(self::PASSWORD),
            'two_factor_secret' => $enrolled ? ($secret ?? Base32::randomSecret()) : null,
            'two_factor_confirmed_at' => $enrolled ? now() : null,
        ]);
    }

    private function login(): array
    {
        return $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@example.test',
            'password' => self::PASSWORD,
        ])->assertOk()->json('data');
    }

    // ── What the login response may say ─────────────────────────────────────

    public function test_a_login_owing_a_second_factor_gives_away_nothing_about_the_account(): void
    {
        // Otherwise this is a free enumeration and role-disclosure oracle for
        // anyone working through a leaked password list.
        $this->admin(enrolled: true);

        $data = $this->login();

        $this->assertTrue($data['two_factor_required']);
        $this->assertNotEmpty($data['challenge_token']);
        $this->assertArrayNotHasKey('user', $data);
        $this->assertArrayNotHasKey('access_token', $data);
    }

    public function test_an_account_without_a_second_factor_still_logs_in_normally(): void
    {
        $this->admin(enrolled: false);

        $data = $this->login();

        $this->assertArrayNotHasKey('two_factor_required', $data);
        $this->assertNotEmpty($data['access_token']);
    }

    // ── The challenge is not a session ──────────────────────────────────────

    public function test_a_challenge_token_cannot_be_used_as_a_bearer(): void
    {
        // The whole reason it is a table row rather than an ability-scoped
        // Sanctum token: nothing resolves it except the verify endpoint.
        // Issued directly rather than through /auth/login: `Auth::attempt`
        // would leave a session cookie that authenticates every later request
        // in this test, which is a harness artefact and would mask the answer.
        $user = $this->admin(enrolled: true);
        $challenge = TwoFactorChallengeToken::issue($user, '127.0.0.1');

        $this->getJson('/api/v1/user', ['Authorization' => "Bearer {$challenge}"])
            ->assertUnauthorized();

        // And the direct claim: it is not a Sanctum token at all.
        $this->assertNull(PersonalAccessToken::findToken($challenge));
    }

    // ── Verifying ───────────────────────────────────────────────────────────

    public function test_a_valid_code_exchanges_the_challenge_for_a_session(): void
    {
        $secret = Base32::randomSecret();
        $this->admin(enrolled: true, secret: $secret);
        $challenge = $this->login()['challenge_token'];

        $token = $this->postJson('/api/v1/auth/2fa/verify', [
            'challenge_token' => $challenge,
            'code' => Totp::at($secret, Totp::timestep()),
        ])->assertOk()->json('data.access_token');

        $this->getJson('/api/v1/user', ['Authorization' => "Bearer {$token}"])->assertOk();
    }

    public function test_the_same_code_cannot_be_spent_twice(): void
    {
        // The realistic attack is a phishing proxy relaying a code the victim
        // just typed — the ±1 drift window would otherwise leave it live for
        // about ninety seconds.
        $secret = Base32::randomSecret();
        $this->admin(enrolled: true, secret: $secret);
        $code = Totp::at($secret, Totp::timestep());

        $first = $this->login()['challenge_token'];
        $this->postJson('/api/v1/auth/2fa/verify', ['challenge_token' => $first, 'code' => $code])->assertOk();

        $second = $this->login()['challenge_token'];
        $this->postJson('/api/v1/auth/2fa/verify', ['challenge_token' => $second, 'code' => $code])
            ->assertUnprocessable();
    }

    public function test_a_consumed_challenge_cannot_be_reused(): void
    {
        $secret = Base32::randomSecret();
        $this->admin(enrolled: true, secret: $secret);
        $challenge = $this->login()['challenge_token'];

        $this->postJson('/api/v1/auth/2fa/verify', [
            'challenge_token' => $challenge,
            'code' => Totp::at($secret, Totp::timestep()),
        ])->assertOk();

        $this->postJson('/api/v1/auth/2fa/verify', [
            'challenge_token' => $challenge,
            'code' => Totp::at($secret, Totp::timestep() + 1),
        ])->assertUnprocessable();
    }

    public function test_five_wrong_codes_destroy_the_challenge(): void
    {
        // The primary brute-force control. It cannot be spread across IPs,
        // because every fresh challenge costs a correct password.
        $this->admin(enrolled: true);
        $challenge = $this->login()['challenge_token'];

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/2fa/verify', [
                'challenge_token' => $challenge,
                'code' => '000000',
            ])->assertUnprocessable();
        }

        $this->assertSame(0, TwoFactorChallenge::count(), 'The challenge must be gone, not merely locked.');
    }

    // ── Enrolment ───────────────────────────────────────────────────────────

    public function test_setup_then_confirm_enables_it_and_revokes_existing_sessions(): void
    {
        // Turning 2FA on is what someone does after suspecting a compromise —
        // leaving the attacker's 30-day refresh token alive would defeat it.
        $user = $this->admin(enrolled: false);
        Sanctum::actingAs($user, ['access-api']);

        $secret = $this->postJson('/api/v1/auth/2fa/setup')->assertOk()->json('data.secret');
        $stale = $user->createToken('access_token', ['access-api'])->plainTextToken;

        $this->postJson('/api/v1/auth/2fa/confirm', [
            'code' => Totp::at($secret, Totp::timestep()),
        ])->assertOk();

        $this->assertNotNull($user->fresh()->two_factor_confirmed_at);

        // `Sanctum::actingAs` pins a user onto the guard for the whole test, so
        // clear it before judging the token itself.
        $this->app['auth']->forgetGuards();

        $this->getJson('/api/v1/user', ['Authorization' => "Bearer {$stale}"])->assertUnauthorized();
        $this->assertSame(0, $user->fresh()->tokens()->count());
    }

    public function test_confirm_refuses_a_wrong_code_and_leaves_it_off(): void
    {
        // Enrolment is only real once a code has been produced — a mistyped or
        // half-scanned secret must not lock anyone out at their next login.
        $user = $this->admin(enrolled: false);
        Sanctum::actingAs($user, ['access-api']);

        $this->postJson('/api/v1/auth/2fa/setup')->assertOk();
        $this->postJson('/api/v1/auth/2fa/confirm', ['code' => '000000'])->assertUnprocessable();

        $this->assertNull($user->fresh()->two_factor_confirmed_at);
    }

    public function test_setup_refuses_to_silently_rotate_a_live_secret(): void
    {
        // An attacker holding a hijacked session could otherwise re-enrol their
        // own authenticator without the account owner noticing.
        $user = $this->admin(enrolled: true);
        Sanctum::actingAs($user, ['access-api']);

        $this->postJson('/api/v1/auth/2fa/setup')->assertStatus(409);
    }

    public function test_disabling_requires_the_current_password(): void
    {
        $user = $this->admin(enrolled: true);
        Sanctum::actingAs($user, ['access-api']);

        $this->postJson('/api/v1/auth/2fa/disable', ['password' => 'wrong'])->assertUnprocessable();
        $this->assertNotNull($user->fresh()->two_factor_confirmed_at);

        $this->postJson('/api/v1/auth/2fa/disable', ['password' => self::PASSWORD])->assertOk();
        $this->assertNull($user->fresh()->two_factor_confirmed_at);
    }

    // ── Enforcement ─────────────────────────────────────────────────────────

    public function test_an_admin_without_a_second_factor_is_refused_but_never_stranded(): void
    {
        $user = $this->admin(enrolled: false);
        Sanctum::actingAs($user, ['access-api']);

        $this->getJson('/api/v1/products')
            ->assertForbidden()
            ->assertJsonPath('data.code', 'two_factor_setup_required');

        // Enrolment lives outside the admin group, so the way out stays open.
        $this->postJson('/api/v1/auth/2fa/setup')->assertOk();
    }

    public function test_a_member_is_not_forced_to_enrol(): void
    {
        // Mandatory for admins only — their panel moves money and reads every
        // customer's contact details.
        $role = Role::factory()->create(['name' => 'Member']);
        $member = User::factory()->withoutTwoFactor()->create(['role_id' => $role->id]);
        Sanctum::actingAs($member, ['access-api']);

        $this->getJson('/api/v1/user')->assertOk();
    }
}
