<?php

namespace Tests\Feature\Auth;

use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class RegisterAndPasswordResetTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Budi Santoso',
            'username' => 'budisan',
            'email' => 'budi@example.com',
            'phone' => '628123456789',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ], $overrides);
    }

    public function test_register_creates_a_member_and_returns_a_token_pair(): void
    {
        $role = Role::factory()->create(['name' => 'Member']);

        $response = $this->postJson('/api/v1/auth/register', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.user.email', 'budi@example.com')
            ->assertJsonPath('data.user.role', 'member');

        $this->assertNotEmpty($response->json('data.access_token'));
        $this->assertNotEmpty($response->json('data.refresh_token'));

        $this->assertDatabaseHas('users', [
            'email' => 'budi@example.com',
            'username' => 'budisan',
            'role_id' => $role->id,
        ]);
    }

    public function test_register_never_lets_the_caller_choose_their_role(): void
    {
        $member = Role::factory()->create(['name' => 'Member']);
        $admin = Role::factory()->create(['name' => 'Admin']);

        $this->postJson('/api/v1/auth/register', $this->payload(['role_id' => $admin->id]))
            ->assertCreated();

        $this->assertSame($member->id, User::firstWhere('email', 'budi@example.com')->role_id);
    }

    public function test_register_rejects_a_duplicate_email_or_phone(): void
    {
        $role = Role::factory()->create(['name' => 'Member']);
        User::factory()->create(['role_id' => $role->id, 'email' => 'budi@example.com', 'phone' => '628999999999']);

        $this->postJson('/api/v1/auth/register', $this->payload())
            ->assertStatus(422)
            ->assertJsonPath('errors.email.0', 'Email sudah terdaftar.');

        $this->postJson('/api/v1/auth/register', $this->payload(['email' => 'lain@example.com', 'phone' => '628999999999']))
            ->assertStatus(422)
            ->assertJsonPath('errors.phone.0', 'Nomor WhatsApp sudah terdaftar.');
    }

    public function test_register_rejects_a_mismatched_password_confirmation(): void
    {
        Role::factory()->create(['name' => 'Member']);

        $this->postJson('/api/v1/auth/register', $this->payload(['password_confirmation' => 'different']))
            ->assertStatus(422)
            ->assertJsonPath('errors.password.0', 'Konfirmasi password tidak cocok.');
    }

    public function test_forgot_password_emails_a_reset_link(): void
    {
        Notification::fake();
        $role = Role::factory()->create(['name' => 'Member']);
        $user = User::factory()->create(['role_id' => $role->id, 'email' => 'budi@example.com']);

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'budi@example.com'])->assertOk();

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_forgot_password_does_not_reveal_whether_an_email_exists(): void
    {
        Notification::fake();

        // Same 200 and same message as the registered case — otherwise this
        // endpoint becomes an account-enumeration oracle.
        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'nobody@example.com'])
            ->assertOk()
            ->assertJsonPath('message', 'Jika email terdaftar, tautan reset password telah dikirim.');

        Notification::assertNothingSent();
    }

    public function test_reset_password_updates_the_password_and_revokes_existing_tokens(): void
    {
        $role = Role::factory()->create(['name' => 'Member']);
        $user = User::factory()->create(['role_id' => $role->id, 'email' => 'budi@example.com']);
        $user->createToken('access_token');

        $token = Password::createToken($user);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'budi@example.com',
            'password' => 'newsecret123',
            'password_confirmation' => 'newsecret123',
        ])->assertOk();

        $this->assertTrue(Hash::check('newsecret123', $user->fresh()->password));
        // A reset is the recovery path after a compromise; leaving old sessions
        // alive would defeat it.
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_reset_password_rejects_an_invalid_token(): void
    {
        $role = Role::factory()->create(['name' => 'Member']);
        User::factory()->create(['role_id' => $role->id, 'email' => 'budi@example.com']);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => 'not-a-real-token',
            'email' => 'budi@example.com',
            'password' => 'newsecret123',
            'password_confirmation' => 'newsecret123',
        ])->assertStatus(422);
    }
}
