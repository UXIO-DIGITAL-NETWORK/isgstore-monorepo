<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Two-factor authentication (TOTP — Google Authenticator and friends).
 *
 * `two_factor_secret` uses the `encrypted` cast. **Rotating `APP_KEY` therefore
 * bricks every enrolled authenticator** — the secrets become undecryptable and
 * every admin has to re-enrol via `php artisan two-factor:disable`. That is the
 * accepted cost of not storing a shared secret in plaintext; it is written here
 * because it is the kind of thing discovered at the worst moment otherwise.
 *
 * `two_factor_last_used_timestep` is what stops a code being replayed. The ±1
 * drift window leaves a single code valid for about ninety seconds, and the
 * realistic attack on TOTP is a phishing proxy relaying a code the victim just
 * typed — recording the last accepted step closes that.
 *
 * `two_factor_challenges` follows `refund_requests.claim_token_hash` exactly:
 * only the sha256 is stored, the plaintext travels once in the login response.
 * A dedicated table rather than an ability-scoped Sanctum token on purpose —
 * a Sanctum token's safety would depend on `abilities:access-api` being present
 * on every route added from here on, and one omission six months from now would
 * silently turn the challenge back into a session. Nothing resolves a row here
 * except the verify endpoint, so it cannot authenticate anything by accident.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('two_factor_secret')->nullable()->after('password');
            // Null means "started setup but never proved a code" — enrolment is
            // only real once the user has produced one, or a mistyped secret
            // would lock them out at the next login.
            $table->timestamp('two_factor_confirmed_at')->nullable()->after('two_factor_secret');
            $table->unsignedBigInteger('two_factor_last_used_timestep')->nullable()->after('two_factor_confirmed_at');
        });

        Schema::create('two_factor_challenges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->char('token_hash', 64)->unique();
            $table->timestamp('expires_at');
            // Five wrong codes destroys the challenge. This is the primary
            // brute-force control, not the rate limiter: it is immune to
            // distributed guessing, because every fresh challenge costs a
            // correct password.
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('consumed_at')->nullable();
            // Bound to where the password was accepted; login-to-verify is
            // seconds, so a change of address means someone else is finishing
            // the login.
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index(['user_id', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('two_factor_challenges');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['two_factor_secret', 'two_factor_confirmed_at', 'two_factor_last_used_timestep']);
        });
    }
};
