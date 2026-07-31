<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Records the discount actually applied to an order, and gives payment
 * channels the presentational fields the admin needs to manage them.
 *
 * `discount_amount` is stored on the transaction rather than recomputed from
 * the promo: promo rules change, and a historical invoice must keep showing
 * the figure the customer was charged.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->foreignId('promo_id')->nullable()->after('payment_channel_id')->constrained()->nullOnDelete();
            $table->unsignedBigInteger('discount_amount')->default(0)->after('amount_fee');
        });

        Schema::table('payment_channels', function (Blueprint $table) {
            $table->string('logo_path')->nullable()->after('name');
            $table->string('description')->nullable()->after('logo_path');
            $table->unsignedInteger('sort_order')->default(0)->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['promo_id']);
            $table->dropColumn(['promo_id', 'discount_amount']);
        });

        Schema::table('payment_channels', function (Blueprint $table) {
            $table->dropColumn(['logo_path', 'description', 'sort_order']);
        });
    }
};
