<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Articles and news, discriminated by `type`.
 *
 * One table rather than two: they differ only in where the storefront lists
 * them, and splitting would duplicate the category relation, the SEO block and
 * every query.
 *
 * `body_sections` is structured JSON — `[{heading?, paragraphs[]}]` — not HTML.
 * That is the exact shape the storefront's article renderer already consumes,
 * so live content drops in without a `dangerouslySetInnerHTML` rewrite of a
 * working component. The admin edits it through a section repeater.
 *
 * `author_name` is a plain string beside the optional `author_id`: the byline
 * is editorial (an alias like "Admin_Topupgame") and does not have to
 * correspond to a user row.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_category_id')->constrained()->cascadeOnDelete();
            // Per-article override for the category badge; falls back to the category name when null.
            $table->string('category_label')->nullable();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('author_name')->default('Admin');
            $table->enum('type', ['article', 'news'])->default('article')->index();
            $table->string('locale', 5)->default('id')->index();
            $table->string('title');
            $table->string('slug');
            $table->string('excerpt', 300)->nullable();
            $table->json('body_sections')->nullable();
            $table->string('image_path')->nullable();
            $table->boolean('is_published')->default(false);
            $table->boolean('is_featured')->default(false);
            $table->timestamp('published_at')->nullable()->index();
            $table->unsignedBigInteger('view_count')->default(0);
            $table->string('meta_title')->nullable();
            $table->string('meta_description', 280)->nullable();
            $table->json('meta_keywords')->nullable();
            $table->string('meta_robots')->nullable();
            $table->timestamps();

            // A slug only has to be unique within its language — the same
            // article translated keeps the same readable URL segment.
            $table->unique(['slug', 'locale']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
