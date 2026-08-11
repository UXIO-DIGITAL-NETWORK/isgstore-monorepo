<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Merchant ("client") attribution for the payment page.
 *
 * A product belongs to the client that sells it; a transaction copies that
 * ownership at checkout so settlement knows whose balance to credit. Both are
 * nullable: existing platform-owned catalogue and legacy transactions keep
 * merchant_id = null and are treated as platform revenue only.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('merchant_id')->nullable()->after('id')
                ->constrained('users')->nullOnDelete();
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->foreignId('merchant_id')->nullable()->after('user_id')
                ->constrained('users')->nullOnDelete();
            $table->index('merchant_id');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('merchant_id');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('merchant_id');
        });
    }
};
