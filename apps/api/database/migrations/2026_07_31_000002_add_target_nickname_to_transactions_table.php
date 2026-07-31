<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The in-game nickname resolved at checkout time.
 *
 * Frozen into the row on purpose: it is what the customer saw and confirmed
 * before paying, so the receipt must keep showing that value even if the player
 * later renames the account.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('target_nickname')->nullable()->after('target_server')
                ->comment('Nickname in-game hasil validasi saat checkout');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn('target_nickname');
        });
    }
};
