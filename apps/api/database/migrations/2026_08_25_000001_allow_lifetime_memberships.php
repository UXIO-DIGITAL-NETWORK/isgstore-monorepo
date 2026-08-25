<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Makes a membership able to never expire.
 *
 * NULL is the lifetime sentinel on both columns: a plan with no
 * `duration_days` grants a subscription with no `ends_at`. Zero would have been
 * storable without this migration, but it is actively wrong — `addDays(0)` puts
 * `ends_at` at `starts_at`, and `memberships:expire` sweeps anything already
 * past, so every "lifetime" buyer would be demoted on the next 00:15 run.
 *
 * `users.membership_expires_at` is already nullable and needs no change. Note it
 * becomes ambiguous — NULL now means "no membership" or "never expires" — which
 * is harmless because nothing reads it to decide entitlement; pricing resolves
 * from `users.role_id` via App\Support\Pricing\RolePrice.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('membership_plans', function (Blueprint $table) {
            $table->unsignedInteger('duration_days')->nullable()->change();
        });

        Schema::table('membership_subscriptions', function (Blueprint $table) {
            $table->timestamp('ends_at')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Existing lifetime rows have no honest finite value to fall back to, so
        // they are not rewritten — reversing this migration on a database that
        // already sold lifetime plans will fail on the NOT NULL constraint. That
        // is the correct outcome: it needs a human decision, not a default.
        Schema::table('membership_subscriptions', function (Blueprint $table) {
            $table->timestamp('ends_at')->nullable(false)->change();
        });

        Schema::table('membership_plans', function (Blueprint $table) {
            $table->unsignedInteger('duration_days')->nullable(false)->change();
        });
    }
};
