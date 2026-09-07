<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Origin flag, kept separate from the display `type`: marks automated
 * machine-to-machine events (uxiolabs order/webhook, Monetapay callbacks,
 * scheduled price checks) so the admin Activity feed can hide them while a
 * single transaction's trail still shows its full lifecycle. Defaults false —
 * every existing row stays visible.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->boolean('is_system')->default(false)->index()->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropColumn('is_system');
        });
    }
};
