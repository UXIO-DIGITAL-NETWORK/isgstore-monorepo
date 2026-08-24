<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Records when a provider SKU was first seen upstream.
 *
 * Without this, "New" in the Add panel can only mean "not pooled yet", which on
 * day one is every SKU the provider sells — a badge that flags everything flags
 * nothing. With a first-seen stamp, "New" means the provider actually added it
 * recently, which is the thing an admin needs to notice.
 *
 * Written by the 5-minute price checker as an insertOrIgnore of the (normally
 * empty) diff, so the steady-state cost is one pluck and no writes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_sku_sightings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained('suppliers')->cascadeOnDelete();
            $table->string('buyer_sku_code');
            $table->string('provider_category')->nullable();
            $table->timestamp('first_seen_at');

            $table->unique(['supplier_id', 'buyer_sku_code']);
            $table->index(['supplier_id', 'first_seen_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_sku_sightings');
    }
};
