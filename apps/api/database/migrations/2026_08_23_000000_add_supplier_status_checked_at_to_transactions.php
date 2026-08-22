<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Last time we polled uxiotopup's /status for this order. Lets the reaper
 * (uxiotopup:sync-processing) tell a live 5s poll chain from a dead one — a
 * healthy chain keeps this fresh, so only genuinely stalled orders get re-armed.
 * Additive/backfill-safe: existing rows stay null and are treated as never-polled.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->timestamp('supplier_status_checked_at')->nullable()->index()->after('supplier_status');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn('supplier_status_checked_at');
        });
    }
};
