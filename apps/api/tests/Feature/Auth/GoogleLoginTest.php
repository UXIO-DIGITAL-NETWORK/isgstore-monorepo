<?php

namespace Tests\Feature\Auth;

use App\Models\Role;
use App\Models\User;
use App\Services\GoogleTokenVerifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class GoogleLoginTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Swap the network-bound verifier for one that returns a fixed payload,
     * so the test never talks to Google.
     *
     * @param  array<string, mixed>|null  $payload
     */
    private function fakeVerifier(?array $payload): void
    {
        $mock = Mockery::mock(GoogleTokenVerifier::class);
        $mock->shouldReceive('verify')->andReturn($payload);
        $this->app->instance(GoogleTokenVerifier::class, $mock);
    }

    private function googlePayload(array $overrides = []): array
    {
        return array_merge([
            'sub' => '1234567890',
            'email' => 'budi@gmail.com',
            'email_verified' => true,
            'name' => 'Budi Santoso',
            'picture' => 'https://lh3.googleusercontent.com/a/avatar.png',
        ], $overrides);
    }

    public function test_first_time_google_sign_in_creates_a_member_and_returns_a_token_pair(): void
    {
        $role = Role::factory()->create(['name' => 'Member']);
        $this->fakeVerifier($this->googlePayload());

        $response = $this->postJson('/api/v1/auth/google', ['credential' => 'fake-id-token'])
            ->assertOk()
            ->assertJsonPath('data.user.email', 'budi@gmail.com')
            ->assertJsonPath('data.user.role', 'member');

        $this->assertNotEmpty($response->json('data.access_token'));
        $this->assertNotEmpty($response->json('data.refresh_token'));

        $this->assertDatabaseHas('users', [
            'email' => 'budi@gmail.com',
            'google_id' => '1234567890',
            'role_id' => $role->id,
        ]);
    }

    public function test_returning_google_user_reuses_the_same_row(): void
    {
        $role = Role::factory()->create(['name' => 'Member']);
        User::factory()->create([
            'role_id' => $role->id,
            'email' => 'budi@gmail.com',
            'google_id' => '1234567890',
        ]);
        $this->fakeVerifier($this->googlePayload());

        $this->postJson('/api/v1/auth/google', ['credential' => 'fake-id-token'])->assertOk();

        $this->assertSame(1, User::where('email', 'budi@gmail.com')->count());
    }

    public function test_existing_email_account_gets_its_google_identity_linked(): void
    {
        $role = Role::factory()->create(['name' => 'Member']);
        $user = User::factory()->create([
            'role_id' => $role->id,
            'email' => 'budi@gmail.com',
            'google_id' => null,
        ]);
        $this->fakeVerifier($this->googlePayload());

        $this->postJson('/api/v1/auth/google', ['credential' => 'fake-id-token'])->assertOk();

        $this->assertSame(1, User::where('email', 'budi@gmail.com')->count());
        $this->assertSame('1234567890', $user->fresh()->google_id);
    }

    public function test_invalid_token_is_rejected(): void
    {
        Role::factory()->create(['name' => 'Member']);
        $this->fakeVerifier(null);

        $this->postJson('/api/v1/auth/google', ['credential' => 'bad-token'])
            ->assertStatus(422)
            ->assertJsonPath('status', 'fail');
    }

    public function test_unverified_google_email_is_rejected(): void
    {
        Role::factory()->create(['name' => 'Member']);
        $this->fakeVerifier($this->googlePayload(['email_verified' => false]));

        $this->postJson('/api/v1/auth/google', ['credential' => 'fake-id-token'])
            ->assertStatus(422);

        $this->assertDatabaseMissing('users', ['email' => 'budi@gmail.com']);
    }

    public function test_missing_credential_fails_validation(): void
    {
        $this->postJson('/api/v1/auth/google', [])
            ->assertStatus(422)
            ->assertJsonPath('errors.credential.0', 'The credential field is required.');
    }
}
