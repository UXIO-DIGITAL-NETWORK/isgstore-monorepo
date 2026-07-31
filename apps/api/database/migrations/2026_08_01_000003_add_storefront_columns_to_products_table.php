<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Merchandising columns the admin's Add Product form already collects.
 *
 * `status` and `is_available` are deliberately separate, matching the two
 * stacked badges the admin list renders: `status` is lifecycle (is this
 * product row retired?), `is_available` is storefront visibility (should
 * customers see it right now?). Collapsing them would make "temporarily hidden"
 * indistinguishable from "discontinued".
 *
 * All nullable except `is_available`, which defaults true so every existing
 * product stays visible.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('sub_name')->nullable()->after('name');
            $table->string('logo')->nullable()->after('code');
            $table->text('description')->nullable()->after('logo');
            $table->string('validasi_nickname')->nullable()->after('description');
            $table->string('access')->nullable()->after('validasi_nickname');
            $table->string('tag')->nullable()->after('access');
            $table->boolean('is_available')->default(true)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'sub_name',
                'logo',
                'description',
                'validasi_nickname',
                'access',
                'tag',
                'is_available',
            ]);
        });
    }
};
