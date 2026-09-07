<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One selling price per (product × membership plan) — the table that makes the
 * number of pricing tiers a data question instead of a schema one.
 *
 * It replaces the four fixed `products.price_{member,vip,reseller,agent}`
 * columns, which capped the platform at four tiers no matter how many plans an
 * admin created.
 *
 * The authored margin lives here too, next to the price it produced. Margins
 * used to sit on `supplier_products` (per supplier→product mapping), which was
 * only ever a proxy for the product — a product has one active supplier at a
 * time. Keeping them together makes repricing a pure function of
 * (cost, margin) and removes the "which mapping's margin wins when the pool
 * rotates" question the supplier-pool feature opened.
 *
 * `products.price_member` survives as a denormalised copy of the default plan's
 * price: six places sort and filter on it, and turning those into joins would
 * cost an index for no gain on the pages that carry real traffic. That makes
 * one invariant — `price_member` must equal this table's default-plan row — and
 * `WritePlanPricesAction` is the single writer that keeps it, with
 * `pricing:verify` to prove it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_plan_prices', function (Blueprint $table) {
            $table->id();

            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('membership_plan_id')->constrained('membership_plans')->cascadeOnDelete();

            // One price per pair. This is also the upsert key the repricer uses.
            $table->unique(['product_id', 'membership_plan_id']);

            // Final rupiah, already clamped to the product's price window.
            $table->unsignedBigInteger('price');

            // What produced it. Null percent = fall through to `pricing_rules`,
            // matching the nullable `supplier_products.margin_*` it replaces.
            $table->decimal('margin_percent', 6, 2)->nullable();
            $table->integer('margin_flat')->default(0);

            // An admin typed this price by hand; the scheduled repricer must
            // leave it alone. Mirrors `products.is_price_locked`, but per tier.
            $table->boolean('is_manual')->default(false);

            $table->timestamps();

            // Ordering a catalogue within one plan.
            $table->index(['membership_plan_id', 'price']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_plan_prices');
    }
};
