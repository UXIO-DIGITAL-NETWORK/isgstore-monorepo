<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Moving an authenticator to another device without ever standing unprotected.
 *
 * Until now the only way to re-enrol was `disable` (password, revokes every
 * token) followed by a fresh `setup` — which leaves the account with **no
 * second factor at all** between the two, and logs the admin out in the middle
 * of the act they were trying to complete.
 *
 * `two_factor_pending_secret` is that window closed. A rotation writes the new
 * secret here and leaves `two_factor_secret` and `two_factor_confirmed_at`
 * exactly as they were, so the **old authenticator keeps working** until a code
 * from the new one proves it was scanned correctly. Promotion is the only thing
 * that touches the live column. An admin who closes the tab halfway through has
 * lost nothing.
 *
 * Overwriting `two_factor_secret` instead would lock an admin out of their own
 * panel on any half-finished rotation — a mistyped secret, a phone that failed
 * to scan, a tab closed by accident — and it is the kind of failure only
 * discovered at the worst possible moment.
 *
 * `two_factor_pending_created_at` expires an abandoned rotation (see
 * `TwoFactorAction::PENDING_TTL_MINUTES`). A secret left sitting for weeks is
 * material for a silent enrolment if the session it was created in ever leaked.
 *
 * The pending column carries the same `encrypted` cast as the live one, so the
 * `APP_KEY` warning on `2026_09_02_000004_add_two_factor_authentication`
 * applies to it unchanged.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('two_factor_pending_secret')->nullable()->after('two_factor_secret');
            $table->timestamp('two_factor_pending_created_at')->nullable()->after('two_factor_pending_secret');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['two_factor_pending_secret', 'two_factor_pending_created_at']);
        });
    }
};
