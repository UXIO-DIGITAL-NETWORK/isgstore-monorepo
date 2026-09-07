<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('type_id')->constrained('category_types')->cascadeOnDelete();
            $table->string('name');
            $table->string('sub_name')->nullable();
            $table->string('code')->unique();
            $table->string('slug')->nullable()->unique();
            $table->string('uid_parser')->nullable();
            $table->string('validasi_nickname')->nullable();
            $table->string('region')->nullable();
            // logo = square icon; thumbnail = portrait card art; banner = wide checkout header.
            $table->string('logo')->nullable();
            $table->string('thumbnail')->nullable();
            $table->string('banner')->nullable();
            $table->text('description')->nullable();
            $table->json('order_form_fields')->nullable();
            // SEO
            $table->string('meta_title')->nullable();
            $table->string('meta_description')->nullable();
            $table->string('og_image')->nullable();
            $table->json('meta_keywords')->nullable();
            $table->string('meta_robots')->nullable();
            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
