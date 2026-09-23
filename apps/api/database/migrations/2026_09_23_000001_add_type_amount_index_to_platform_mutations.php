<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `PlatformBalance::income()` sums `amount` over a fixed set of `type` values,
 * and the Hub reads it on its one-minute summary pull. Without an index on
 * `type` that is a full scan of the whole profit ledger, every minute — and it
 * used to run twice per pull. `(type, amount)` is covering for that query: the
 * type narrows the range and `amount` is all it has to read, so no row lookups.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('platform_mutations', function (Blueprint $table) {
            $table->index(['type', 'amount'], 'platform_mutations_type_amount_idx');
        });
    }

    public function down(): void
    {
        Schema::table('platform_mutations', function (Blueprint $table) {
            $table->dropIndex('platform_mutations_type_amount_idx');
        });
    }
};
