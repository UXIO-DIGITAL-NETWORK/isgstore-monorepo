<?php

namespace Tests\Feature\Locale;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Storing the language someone picked.
 *
 * `users.locale` is the source of truth `SetLocale` reads, and it is what makes
 * the choice follow an admin from their laptop to their phone — `localStorage`
 * in each panel cannot. Deliberately its own endpoint rather than an extra
 * field on `sync-timezone`: that route's name promises one thing, and timezone
 * is detected from the browser while this is chosen by a person.
 */
class UpdateLocaleTest extends TestCase
{
    use RefreshDatabase;

    private function member(string $locale = 'id'): User
    {
        $role = Role::factory()->create(['name' => 'Member']);

        return User::factory()->withoutTwoFactor()->create([
            'role_id' => $role->id,
            'locale' => $locale,
        ]);
    }

    public function test_it_stores_the_chosen_language(): void
    {
        $user = $this->member('id');
        Sanctum::actingAs($user, ['access-api']);

        $this->patchJson('/api/v1/me/locale', ['locale' => 'en'])
            ->assertOk()
            ->assertJsonPath('data.locale', 'en');

        $this->assertSame('en', $user->fresh()->locale);
    }

    public function test_it_refuses_a_language_the_platform_does_not_have(): void
    {
        // Anything outside the shipped set would leave the account resolving to
        // the fallback forever, with a value on screen that never takes effect.
        $user = $this->member('id');
        Sanctum::actingAs($user, ['access-api']);

        $this->patchJson('/api/v1/me/locale', ['locale' => 'fr'])->assertUnprocessable();
        $this->patchJson('/api/v1/me/locale', [])->assertUnprocessable();

        $this->assertSame('id', $user->fresh()->locale);
    }

    public function test_it_needs_a_session(): void
    {
        $this->patchJson('/api/v1/me/locale', ['locale' => 'en'])->assertUnauthorized();
    }

    public function test_the_user_payload_reports_the_stored_language(): void
    {
        // The panels read it back on sign-in so the choice survives a new
        // device, where localStorage is empty.
        Sanctum::actingAs($this->member('en'), ['access-api']);

        $this->getJson('/api/v1/user')
            ->assertOk()
            ->assertJsonPath('data.locale', 'en');
    }
}
