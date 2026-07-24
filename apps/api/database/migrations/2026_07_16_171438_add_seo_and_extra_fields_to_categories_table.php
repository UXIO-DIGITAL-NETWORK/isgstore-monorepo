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
        Schema::table('categories', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('code');
            $table->string('uid_parser')->nullable()->after('slug');
            $table->string('sub_name')->nullable()->after('name');
            $table->json('order_form_fields')->nullable()->after('description');
            $table->string('meta_title')->nullable()->after('order_form_fields');
            $table->string('meta_description')->nullable()->after('meta_title');
            $table->string('og_image')->nullable()->after('meta_description');
            $table->json('meta_keywords')->nullable()->after('og_image');
            $table->string('meta_robots')->nullable()->after('meta_keywords');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn([
                'slug',
                'uid_parser',
                'sub_name',
                'order_form_fields',
                'meta_title',
                'meta_description',
                'og_image',
                'meta_keywords',
                'meta_robots',
            ]);
        });
    }
};
