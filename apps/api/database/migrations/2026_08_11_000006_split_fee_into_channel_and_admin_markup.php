<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Split the single stored fee into its two components so the customer can see
 * "Biaya Metode Pembayaran" (channel fee) and "Biaya Admin" (kita's markup)
 * separately. The combined total stays where it was:
 *   transactions.amount_fee  = channel_fee + admin_markup
 *   payments.admin_fee       = channel_fee + admin_markup
 * (settlement / platform-profit keep reading those, unchanged).
 *
 * Backfill: every existing row's fee was entirely the channel fee — the admin
 * markup shipped defaulting to 0 and no historical transaction carried one — so
 * channel_fee = the old combined value and admin_markup = 0.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->bigInteger('channel_fee')->default(0)->after('amount_fee');
            $table->bigInteger('admin_markup')->default(0)->after('channel_fee');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->bigInteger('channel_fee')->default(0)->after('admin_fee');
            $table->bigInteger('admin_markup')->default(0)->after('channel_fee');
        });

        DB::table('transactions')->update(['channel_fee' => DB::raw('amount_fee')]);
        DB::table('payments')->update(['channel_fee' => DB::raw('admin_fee')]);
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn(['channel_fee', 'admin_markup']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['channel_fee', 'admin_markup']);
        });
    }
};
