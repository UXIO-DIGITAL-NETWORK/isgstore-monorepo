<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A master on/off switch for the per-game "Cek Username" check, separate from the
 * provider string in `validasi_nickname`. Defaults to true so every existing row
 * keeps today's behaviour — the storefront flag stays provider-driven
 * (`supports_nickname_check = enabled && provider set`) until an operator turns a
 * game off, which no longer means blanking (losing) the provider config.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->boolean('nickname_check_enabled')->default(true)->after('validasi_nickname');
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('nickname_check_enabled');
        });
    }
};
