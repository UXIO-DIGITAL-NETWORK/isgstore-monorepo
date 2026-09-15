<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * One wall clock for the whole platform: WIB (Asia/Jakarta, GMT+7).
 *
 * `users.timezone` used to be whatever zone the browser reported at sign-in, so
 * two admins looking at the same order saw two different clock times, and each
 * one's reports were bucketed on their own local midnight. The panel now renders
 * every date in WIB and ignores the browser's zone, so the stored value must
 * agree with what is displayed or the clock and the report windows would
 * disagree — the exact failure this column was meant to prevent.
 *
 * The column stays (report windows still read it, and the default already says
 * `Asia/Jakarta`); only stale rows are corrected here.
 */
return new class extends Migration
{
    private const TZ = 'Asia/Jakarta';

    public function up(): void
    {
        DB::table('users')
            ->where(function ($query) {
                $query->whereNull('timezone')->orWhere('timezone', '!=', self::TZ);
            })
            ->update(['timezone' => self::TZ]);
    }

    public function down(): void
    {
        // Not reversible on purpose: the previous per-user values were not
        // recorded, and restoring them would put back the disagreement between
        // the displayed clock and the report boundaries.
    }
};
