<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * (supplier_id, buyer_sku_code) is the natural key the Digiflazz price sync
     * upserts against — deduplicate defensively before applying the index.
     */
    public function up(): void
    {
        $duplicates = DB::table('supplier_products')
            ->select('supplier_id', 'buyer_sku_code', DB::raw('MIN(id) as keep_id'))
            ->groupBy('supplier_id', 'buyer_sku_code')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicates as $duplicate) {
            DB::table('supplier_products')
                ->where('supplier_id', $duplicate->supplier_id)
                ->where('buyer_sku_code', $duplicate->buyer_sku_code)
                ->where('id', '!=', $duplicate->keep_id)
                ->delete();
        }

        Schema::table('supplier_products', function (Blueprint $table) {
            $table->unique(['supplier_id', 'buyer_sku_code']);
        });
    }

    public function down(): void
    {
        Schema::table('supplier_products', function (Blueprint $table) {
            $table->dropUnique(['supplier_id', 'buyer_sku_code']);
        });
    }
};
