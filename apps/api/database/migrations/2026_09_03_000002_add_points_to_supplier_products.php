<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Loyalty points are decided when a SKU is priced, on the Set Profit Margin
 * page — the same moment the margins and the price window are decided.
 *
 * They live on the mapping rather than only on `products` because that page is
 * used mostly on pooled rows, which have no product yet: promote copies these
 * across, exactly as it already does for `price_min`/`price_max`.
 *
 * Nullable, and that is load-bearing: null means "use the global `points`
 * settings", while 0 means "this SKU earns nothing".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supplier_products', function (Blueprint $table) {
            $table->decimal('point_percent', 6, 2)->nullable()->after('price_max');
            $table->unsignedInteger('point_flat')->nullable()->after('point_percent');
        });
    }

    public function down(): void
    {
        Schema::table('supplier_products', fn (Blueprint $table) => $table->dropColumn(['point_percent', 'point_flat']));
    }
};
