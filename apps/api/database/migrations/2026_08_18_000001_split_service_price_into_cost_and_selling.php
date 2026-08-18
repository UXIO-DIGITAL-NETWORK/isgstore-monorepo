<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Splits the single `services.price` into the two numbers kita actually needs:
 * what a service costs us per period, and what we bill a client for it.
 *
 * The old column WAS the selling price, so it is renamed rather than dropped —
 * every existing catalogue row, and every price a merchant has already seen,
 * survives untouched. `cost_price` starts at 0 because we have no historical
 * record of it; the operator fills it in from the Product / Services screen.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Rename and add are separate statements so the driver never has to
        // resolve a column that is being renamed in the same batch.
        Schema::table('services', function (Blueprint $table) {
            $table->renameColumn('price', 'selling_price');
        });

        Schema::table('services', function (Blueprint $table) {
            // Rupiah for ONE period, same integer-money rule as selling_price.
            $table->unsignedBigInteger('cost_price')->default(0)->after('features');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('cost_price');
        });

        Schema::table('services', function (Blueprint $table) {
            $table->renameColumn('selling_price', 'price');
        });
    }
};
