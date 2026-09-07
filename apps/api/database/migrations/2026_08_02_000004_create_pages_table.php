<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Static content pages — privacy policy, terms, refund policy.
 *
 * `intro` and `sections` are structured JSON for the same reason articles use
 * `body_sections`: the storefront's policy renderer already consumes
 * `{heading, paragraphs[], bullets?}`, so keeping the stored shape identical
 * means the page goes live without touching the component.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('slug');
            $table->string('locale', 5)->default('id');
            $table->string('title');
            $table->json('intro')->nullable();
            $table->json('sections')->nullable();
            $table->boolean('is_published')->default(true);
            $table->string('meta_title')->nullable();
            $table->string('meta_description', 280)->nullable();
            $table->string('meta_robots')->nullable();
            $table->timestamps();

            $table->unique(['slug', 'locale']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
