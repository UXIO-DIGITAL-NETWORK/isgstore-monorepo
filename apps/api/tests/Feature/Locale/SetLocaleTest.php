<?php

namespace Tests\Feature\Locale;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\App;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Which language the API answers in.
 *
 * Until now there was no answer at all: `config('app.locale')` said `en`, the
 * `users.locale` column defaulted to `id`, and messages were hardcoded in
 * whichever language the author happened to be thinking in — "Login successful"
 * and "Autentikasi dua faktor aktif." live in the same controller.
 *
 * This pins the resolution order rather than the messages themselves; turning
 * the hardcoded strings into keys is its own piece of work.
 */
class SetLocaleTest extends TestCase
{
    use RefreshDatabase;

    private function member(string $locale): User
    {
        $role = Role::factory()->create(['name' => 'Member']);

        return User::factory()->withoutTwoFactor()->create([
            'role_id' => $role->id,
            'locale' => $locale,
        ]);
    }

    public function test_it_answers_in_the_language_the_account_chose(): void
    {
        // The account's own setting outranks everything: it is the only signal
        // the person deliberately set, and it follows them between devices.
        Sanctum::actingAs($this->member('en'), ['access-api']);

        $this->getJson('/api/v1/user')->assertOk();

        $this->assertSame('en', App::getLocale());
    }

    public function test_an_indonesian_account_gets_indonesian(): void
    {
        Sanctum::actingAs($this->member('id'), ['access-api']);

        $this->getJson('/api/v1/user')->assertOk();

        $this->assertSame('id', App::getLocale());
    }

    public function test_a_guest_is_read_from_the_browsers_own_preference(): void
    {
        // Nobody is signed in on the storefront's public endpoints, and asking
        // an anonymous buyer to pick a language before seeing a price is worse
        // than reading the header their browser already sends.
        $this->getJson('/api/v1/ping', ['Accept-Language' => 'en-GB,en;q=0.9']);

        $this->assertSame('en', App::getLocale());
    }

    public function test_an_unsupported_language_falls_back_rather_than_failing(): void
    {
        // A browser set to Japanese is not an error. It gets the default.
        $this->getJson('/api/v1/ping', ['Accept-Language' => 'ja,ko;q=0.8']);

        $this->assertSame(config('app.locale'), App::getLocale());
    }

    public function test_a_stored_locale_the_app_does_not_support_is_ignored(): void
    {
        // Older rows, or a value written before the column was constrained.
        Sanctum::actingAs($this->member('fr'), ['access-api']);

        $this->getJson('/api/v1/user')->assertOk();

        $this->assertSame(config('app.locale'), App::getLocale());
    }

    public function test_the_account_outranks_the_browser_header(): void
    {
        Sanctum::actingAs($this->member('id'), ['access-api']);

        $this->getJson('/api/v1/user', ['Accept-Language' => 'en-US,en;q=0.9'])->assertOk();

        $this->assertSame('id', App::getLocale());
    }

    public function test_indonesian_is_the_default_the_platform_ships_with(): void
    {
        // The market is Indonesia — prices are in rupiah and a bare phone
        // number is assumed to be `62`. The config used to say `en` while every
        // column default said `id`, which is how Google sign-ups ended up
        // stored as English.
        $this->assertSame('id', config('app.locale'));
    }

    public function test_validation_messages_follow_the_chosen_language(): void
    {
        // The most visible half of the mix: 12 FormRequests override
        // `messages()` in Indonesian while ~150 fall through to Laravel's own
        // English defaults, so the language of an error depended on which
        // endpoint you happened to hit.
        $indonesian = $this->postJson('/api/v1/auth/login', [], ['Accept-Language' => 'id'])
            ->assertUnprocessable()
            ->json('errors.email.0');

        $english = $this->postJson('/api/v1/auth/login', [], ['Accept-Language' => 'en'])
            ->assertUnprocessable()
            ->json('errors.email.0');

        $this->assertNotSame($indonesian, $english, 'The two languages must not produce the same sentence.');
        $this->assertStringContainsString('wajib', (string) $indonesian);
        $this->assertStringContainsString('required', (string) $english);
    }
}
