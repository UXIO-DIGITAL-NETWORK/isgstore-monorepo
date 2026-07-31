<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-article override for the category badge.
 *
 * The storefront's category filter is a closed set of pills, but the badge on
 * a card is free text and the two legitimately differ: a PUBG Mobile article
 * files under the "lainnya" (other) pill because PUBG has no pill of its own,
 * yet its badge still reads "PUBG MOBILE".
 *
 * Nullable — when unset the badge falls back to the category's own name, which
 * is the case for every article whose topic does have a pill.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->string('category_label')->nullable()->after('article_category_id');
        });
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn('category_label');
        });
    }
};
