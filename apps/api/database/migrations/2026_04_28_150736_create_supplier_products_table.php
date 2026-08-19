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
        Schema::create('supplier_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained('suppliers')->cascadeOnDelete();
            $table->string('buyer_sku_code');
            $table->bigInteger('price');
            // Postpaid (pasca) price-list fields from Digiflazz.
            $table->bigInteger('admin_fee')->nullable();
            $table->bigInteger('commission')->nullable();
            $table->boolean('buyer_product_status')->default(true);
            $table->boolean('seller_product_status')->default(true);
            $table->boolean('is_active')->default(false);
            // Stamped when the daily sync deactivates a mapping; only stamped rows auto-reactivate.
            $table->timestamp('sync_deactivated_at')->nullable();
            $table->timestamps();

            // Natural key the Digiflazz price sync upserts against.
            $table->unique(['supplier_id', 'buyer_sku_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_products');
    }
};
