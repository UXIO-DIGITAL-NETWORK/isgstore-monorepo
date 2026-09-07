<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lets a Main Product be archived instead of destroyed.
 *
 * `transactions.product_id` is NOT NULL and RESTRICT, so a product that has ever
 * been ordered simply could not be deleted — the DELETE threw a QueryException
 * that nothing caught, surfacing as a 500 and leaving the row undeletable
 * forever. Archiving sidesteps that entirely: no row is removed, so the
 * constraint is never tested and the order history keeps pointing at a product
 * that still exists.
 *
 * `Transaction::product()` is declared `withTrashed()` for the same reason — the
 * history has to keep resolving, or the admin transaction list and the dashboard
 * would 500 on a null relation instead.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
