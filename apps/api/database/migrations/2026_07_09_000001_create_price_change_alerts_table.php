<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_change_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_product_id')->constrained('supplier_products')->cascadeOnDelete();
            // Denormalized so the alert stays readable even if the mapping is deleted later
            $table->string('buyer_sku_code');
            $table->string('type', 10)->default('prepaid'); // prepaid | pasca
            // Cost when the pending alert was first raised
            $table->bigInteger('old_price');
            // Latest cost seen by the checker (updated in place while pending)
            $table->bigInteger('new_price');
            $table->string('status', 20)->default('pending'); // App\Enums\PriceAlertStatus
            $table->timestamp('acknowledged_at')->nullable();
            $table->foreignId('acknowledged_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('status');
            $table->index(['supplier_product_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_change_alerts');
    }
};
