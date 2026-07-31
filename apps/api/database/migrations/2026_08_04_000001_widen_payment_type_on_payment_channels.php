<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Makes `payment_channels.payment_type` a plain string on every driver.
 *
 * The 2026-06-21 migration widened it to a string on SQLite but left MySQL as a
 * fixed ENUM. The two environments therefore disagreed, and on MySQL — which is
 * what production runs — no value outside that enum could be stored.
 *
 * The consequence was that the internal wallet channel could not exist:
 * `CheckoutAction`, `RefundFailedTransactionAction` and
 * `ListPaymentChannelsAction` all branch on `channel_code === 'balance'`, so
 * three live code paths had nothing that could ever trigger them, and a member
 * could never spend their balance.
 *
 * A string also means adding a payment type is a seeder change rather than a
 * schema migration, which is the behaviour the original comment intended.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE payment_channels MODIFY COLUMN payment_type VARCHAR(50) NOT NULL');

            return;
        }

        Schema::table('payment_channels', function (Blueprint $table) {
            $table->string('payment_type', 50)->change();
        });
    }

    public function down(): void
    {
        // Deliberately not reinstated: narrowing back to an ENUM would fail on
        // any row using a value outside it, and re-break the wallet.
    }
};
