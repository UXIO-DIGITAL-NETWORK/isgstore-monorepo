<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Restores the "Cek Username" provider on the default games. A reseed had nulled
 * `categories.validasi_nickname` for every game, which flips
 * `supports_nickname_check` to false and hides the storefront button. This puts
 * back the original URL providers — but only where the value is still null, so
 * an operator who has since configured a game is never overwritten.
 */
return new class extends Migration
{
    /** @var array<string,string> code => provider */
    private const DEFAULTS = [
        'mlbb' => 'https://api.uxio.id/validate/mlbb',
        'freefire' => 'https://api.uxio.id/validate/ff',
    ];

    public function up(): void
    {
        foreach (self::DEFAULTS as $code => $provider) {
            DB::table('categories')
                ->where('code', $code)
                ->whereNull('validasi_nickname')
                ->update(['validasi_nickname' => $provider]);
        }
    }

    public function down(): void
    {
        // Only revert the exact values this migration set, so a later manual
        // change survives a rollback.
        foreach (self::DEFAULTS as $code => $provider) {
            DB::table('categories')
                ->where('code', $code)
                ->where('validasi_nickname', $provider)
                ->update(['validasi_nickname' => null]);
        }
    }
};
