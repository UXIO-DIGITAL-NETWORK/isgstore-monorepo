<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Serves the single-type tabs of the unified transaction list, which scope to
 * one client and order by date. `transactions` today carries a bare
 * index('merchant_id') that leaves the sort to a filesort, and
 * `service_invoices` indexes (merchant_id, status), which cannot serve a date
 * order either.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->index(['merchant_id', 'created_at'], 'transactions_merchant_date_idx');
        });

        Schema::table('service_invoices', function (Blueprint $table) {
            $table->index(['merchant_id', 'created_at'], 'service_invoices_merchant_date_idx');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', fn (Blueprint $table) => $table->dropIndex('transactions_merchant_date_idx'));
        Schema::table('service_invoices', fn (Blueprint $table) => $table->dropIndex('service_invoices_merchant_date_idx'));
    }
};
