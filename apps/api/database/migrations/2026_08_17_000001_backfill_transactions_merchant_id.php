<?php

use App\Support\Payment\DefaultMerchant;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Attribute every previously-unowned sale to the single default client merchant.
 *
 * Real checkouts wrote `transactions.merchant_id = null` (products never carried
 * an owner), so the payment-page feeds excluded them entirely. Now that checkout
 * falls back to the default merchant, this backfills the history so both
 * Transaksi tables and the dashboard totals reflect all existing transactions.
 *
 * Touches only NULL rows, so it is naturally idempotent and a no-op when there
 * is no payment-admin user to attribute to.
 */
return new class extends Migration
{
    public function up(): void
    {
        $merchantId = DefaultMerchant::id();

        if (! $merchantId) {
            return;
        }

        DB::table('transactions')
            ->whereNull('merchant_id')
            ->update(['merchant_id' => $merchantId]);
    }

    public function down(): void
    {
        // Attribution is not reversible without knowing which rows were
        // originally null; the payment feeds treat a set merchant_id as the
        // steady state, so there is nothing safe to undo.
    }
};
