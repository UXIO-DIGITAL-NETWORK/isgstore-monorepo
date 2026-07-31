<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Storefront artwork beyond the square `logo`.
 *
 * `thumbnail` is the portrait card art on the homepage grid; `banner` is the
 * wide header on the checkout page. Both nullable — the storefront falls back
 * to its bundled placeholder when a game has no artwork uploaded yet.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->string('thumbnail')->nullable()->after('logo');
            $table->string('banner')->nullable()->after('thumbnail');
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn(['thumbnail', 'banner']);
        });
    }
};
