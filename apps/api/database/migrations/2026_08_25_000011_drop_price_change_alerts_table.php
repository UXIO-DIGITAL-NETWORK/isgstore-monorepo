<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The 5-minute checker now auto-reprices live products and records a
 * price_change_logs audit trail, replacing the manual "acknowledge this alert"
 * flow entirely. This table has no remaining reader, so it is dropped.
 *
 * down() recreates it verbatim (from the original create migration) so the
 * rollback path stays intact.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('price_change_alerts');
    }

    public function down(): void
    {
        Schema::create('price_change_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_product_id')->constrained('supplier_products')->cascadeOnDelete();
            $table->string('buyer_sku_code');
            $table->string('type', 10)->default('prepaid');
            $table->bigInteger('old_price');
            $table->bigInteger('new_price');
            $table->string('status', 20)->default('pending');
            $table->timestamp('acknowledged_at')->nullable();
            $table->foreignId('acknowledged_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('status');
            $table->index(['supplier_product_id', 'status']);
        });
    }
};
