<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Editorial categories for articles and news.
 *
 * `key` is the stable slug the storefront filters on (`mobile-legend`,
 * `free-fire`, …). It is separate from `name` because the storefront's
 * category pills are a closed set with their own translated labels — renaming
 * a category for display must not break the URL or the pill it maps to.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('article_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('key')->unique();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('article_categories');
    }
};
