<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Selling prices are fully manual now — the price checker never reprices,
        // so the auto_price opt-in flag has no consumer left.
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('auto_price');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('auto_price')->default(true)->after('price_agent');
        });
    }
};
