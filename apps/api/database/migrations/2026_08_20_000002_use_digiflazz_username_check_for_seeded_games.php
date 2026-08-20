<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Point the default games' "Cek Username" at Digiflazz.
 *
 * The earlier 2026_08_20_000001 migration (and the old seeder) set
 * `categories.validasi_nickname` to `https://api.uxio.id/validate/{mlbb,ff}` —
 * placeholder URLs that never return a nickname, so the check always failed with
 * "ID tidak ditemukan". This switches those two games to the Digiflazz
 * cek-username SKUs.
 *
 * Only rows that are still null or hold that stale placeholder URL are touched,
 * so a game an operator has since configured by hand is never overwritten.
 */
return new class extends Migration
{
    /** @var array<string,string> code => Digiflazz cek-username provider */
    private const TARGETS = [
        'mlbb' => 'digiflazz:mlus',
        'freefire' => 'digiflazz:ffusername',
    ];

    /** @var array<string,string> code => the stale placeholder URL to replace */
    private const STALE = [
        'mlbb' => 'https://api.uxio.id/validate/mlbb',
        'freefire' => 'https://api.uxio.id/validate/ff',
    ];

    public function up(): void
    {
        foreach (self::TARGETS as $code => $provider) {
            DB::table('categories')
                ->where('code', $code)
                ->where(function ($q) use ($code) {
                    $q->whereNull('validasi_nickname')
                        ->orWhere('validasi_nickname', self::STALE[$code]);
                })
                ->update(['validasi_nickname' => $provider]);
        }
    }

    public function down(): void
    {
        // Revert only the exact values this migration set, so a later manual
        // change survives a rollback.
        foreach (self::TARGETS as $code => $provider) {
            DB::table('categories')
                ->where('code', $code)
                ->where('validasi_nickname', $provider)
                ->update(['validasi_nickname' => self::STALE[$code]]);
        }
    }
};
