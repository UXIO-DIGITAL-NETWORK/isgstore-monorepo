<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // When true, the daily Digiflazz sync recalculates the selling
            // prices from the supplier cost via pricing_rules. Set false to
            // hand-price a product and keep the sync's hands off it.
            $table->boolean('auto_price')->default(true)->after('price_agent');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('auto_price');
        });
    }
};
