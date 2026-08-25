<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Append-only audit trail of what the 5-minute price checker did to each mapping.
 *
 * Since the checker now auto-reprices live products (instead of raising a manual
 * alert), the admin's window into "what changed and why" is this log. One row per
 * event per run — no unique key, no dedupe — so a cost that moves twice leaves two
 * rows and the history reads truthfully. `product_name` is snapshotted because the
 * product may later be renamed or archived and the log must still make sense.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_change_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_product_id')->constrained('supplier_products')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('buyer_sku_code');
            $table->string('product_name');
            $table->string('status', 20); // App\Enums\PriceChangeLogStatus
            $table->bigInteger('old_cost');
            $table->bigInteger('new_cost');
            // Selling prices before/after. Nullable: a deactivated or locked event
            // does not compute a fresh tier set.
            $table->bigInteger('old_price_member')->nullable();
            $table->bigInteger('new_price_member')->nullable();
            $table->bigInteger('old_price_vip')->nullable();
            $table->bigInteger('new_price_vip')->nullable();
            $table->bigInteger('old_price_reseller')->nullable();
            $table->bigInteger('new_price_reseller')->nullable();
            $table->bigInteger('old_price_agent')->nullable();
            $table->bigInteger('new_price_agent')->nullable();
            $table->string('reason')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('created_at');
            $table->index(['status', 'created_at']);
            $table->index('supplier_product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_change_logs');
    }
};
