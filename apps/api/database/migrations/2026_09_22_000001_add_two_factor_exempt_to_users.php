<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * An explicit exemption from the panel's second factor.
 *
 * The admin panel refuses an `admin` who has not enrolled a second factor
 * (`EnsureTwoFactorSatisfied`), and the client routes them to setup off
 * `two_factor_required`. One developer login needs neither. The exemption is a
 * column, not a config list, for one reason: `where two_factor_exempt = 1`
 * lists every account that skips the factor, so the hole is visible in the
 * database and revocable without a deploy.
 *
 * Defaults false — nothing is exempt unless it says so.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('two_factor_exempt')->default(false)->after('two_factor_last_used_timestep');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('two_factor_exempt');
        });
    }
};
