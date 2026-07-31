<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Marks a category type as voucher-style rather than in-game top-up.
 *
 * The admin's add form has always collected this ("This category type is for
 * vouchers") and its list renders a Voucher column, but there was no column to
 * persist it to. Defaults false so every existing row keeps its current
 * meaning.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('category_types', function (Blueprint $table) {
            $table->boolean('is_voucher')->default(false)->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('category_types', function (Blueprint $table) {
            $table->dropColumn('is_voucher');
        });
    }
};
