<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Time-boxed promotional pricing on specific products.
 *
 * `original_price` and `discount_percent` are deliberately **not** stored:
 * both derive from the product's current `price_member` at read time. Freezing
 * them would let a repriced product leave a stale strikethrough on the
 * storefront, advertising a discount that no longer exists.
 *
 * `stock_sold` is a counter rather than a `stock_available` column so the sale
 * cannot drift: available is always `stock_total - stock_sold`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flash_sales', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'starts_at', 'ends_at']);
        });

        Schema::create('flash_sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flash_sale_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('sale_price');
            $table->unsignedInteger('stock_total')->default(0);
            $table->unsignedInteger('stock_sold')->default(0);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['flash_sale_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flash_sale_items');
        Schema::dropIfExists('flash_sales');
    }
};
