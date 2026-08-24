<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Distinguishes a never-published DRAFT from a deactivated product.
 *
 * Promote now creates products with `status = false`, so `status` alone can no
 * longer tell "not published yet" apart from "was live, then retired" — and both
 * will exist in volume. `published_at IS NULL` means never published.
 *
 * Note this deliberately does NOT repurpose `is_available`, which three writers
 * already set to true and no query ever reads; giving it a second meaning would
 * need its own backfill and leave two half-truths instead of one fact.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->timestamp('published_at')->nullable()->after('status');
        });

        // Anything currently live was published at some point; the creation date is
        // the closest honest approximation we still have.
        DB::table('products')
            ->where('status', true)
            ->whereNull('published_at')
            ->update(['published_at' => DB::raw('created_at')]);
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('published_at');
        });
    }
};
