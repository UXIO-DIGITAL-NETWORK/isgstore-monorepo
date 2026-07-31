<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `currency_name` is the in-game currency a sub-category sells (e.g. a
 * "Diamond" sub-category under Mobile Legends), which the admin list shows as
 * its own column. `description` backs the form's storefront copy field.
 *
 * Both nullable: every existing sub-category predates them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sub_categories', function (Blueprint $table) {
            $table->string('currency_name')->nullable()->after('name');
            $table->text('description')->nullable()->after('logo');
        });
    }

    public function down(): void
    {
        Schema::table('sub_categories', function (Blueprint $table) {
            $table->dropColumn(['currency_name', 'description']);
        });
    }
};
