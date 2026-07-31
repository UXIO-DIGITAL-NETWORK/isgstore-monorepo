<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The written half of a review.
 *
 * `ratings` stored only the 1-5 score, but the storefront's review section
 * renders body text. Nullable: a star-only rating stays valid.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ratings', function (Blueprint $table) {
            $table->text('comment')->nullable()->after('rating');
        });
    }

    public function down(): void
    {
        Schema::table('ratings', function (Blueprint $table) {
            $table->dropColumn('comment');
        });
    }
};
