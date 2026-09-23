<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A service subscription that never expires.
 *
 * NULL `ends_at` is the site's lifetime sentinel — the same convention the
 * membership module already uses (`MembershipSubscription::isLifetime()`), so
 * that "seumur hidup" cannot come to mean two different things in one app. Zero
 * would have been storable without this migration and is actively wrong:
 * `addDays(0)` puts `ends_at` at `starts_at`, and `services:expire` sweeps
 * anything already past, so a licence bought outright would be demoted the next
 * night.
 *
 * It is needed now because a site's licence can be bought outright: the Hub
 * grants the term with no end date, and the row mirroring that grant has to be
 * able to say so without inventing a date in the year 2099.
 *
 * `ServiceSubscription::scopeActive()` and the expiry sweep are made
 * lifetime-aware alongside this — a NULL that reads as "lapsed" everywhere
 * would be worse than the date it replaced.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_subscriptions', function (Blueprint $table) {
            $table->timestamp('ends_at')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Existing lifetime rows have no honest finite value to fall back to, so
        // they are not rewritten — reversing this on a database that already
        // sold a lifetime licence will fail on the NOT NULL constraint. That is
        // the correct outcome: it needs a human decision, not a default.
        Schema::table('service_subscriptions', function (Blueprint $table) {
            $table->timestamp('ends_at')->nullable(false)->change();
        });
    }
};
