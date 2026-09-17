<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A per-SKU daily selling allowance, authored by the admin.
 *
 * The provider gives nothing to build on: uxiolabs reports `aktif`/`nonaktif` per
 * service and no quantity at all, and there is no pre-order stock probe (only
 * /service, /saldo, /order, /status). So this is a LOCAL quota — "we will sell at
 * most N of this denomination per day" — not a mirror of the provider's shelf.
 *
 * Nullable, and null means no ceiling: every row that exists today keeps behaving
 * exactly as it did, so this lands without a backfill or a cutover.
 *
 * It lives on the mapping rather than the product because it is a fact about the
 * SUPPLY of that SKU, next to the cost it is derived from. The count of what has
 * been used today is not stored — see `App\Support\Stock\DailyStockLimit`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supplier_products', function (Blueprint $table) {
            $table->unsignedInteger('daily_order_limit')
                ->nullable()
                ->after('is_active')
                ->comment('Max orders per WIB day for this SKU; null = unlimited');
        });
    }

    public function down(): void
    {
        Schema::table('supplier_products', function (Blueprint $table) {
            $table->dropColumn('daily_order_limit');
        });
    }
};
