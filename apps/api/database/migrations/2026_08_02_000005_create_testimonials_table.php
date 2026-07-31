<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Curated testimonials for marketing surfaces.
 *
 * Deliberately separate from `ratings`, which are real purchase-linked reviews
 * tied to a transaction. Merging them would let an admin author something that
 * reads as a verified purchase review — these are editorial and must stay
 * distinguishable from customer-submitted ones.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('testimonials', function (Blueprint $table) {
            $table->id();
            $table->string('author_name');
            $table->string('author_title')->nullable();
            $table->string('avatar_path')->nullable();
            $table->text('content');
            $table->unsignedTinyInteger('rating')->nullable();
            $table->string('game_name')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('testimonials');
    }
};
