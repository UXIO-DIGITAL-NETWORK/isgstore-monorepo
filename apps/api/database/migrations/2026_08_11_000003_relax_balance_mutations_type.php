<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The wallet ledger now also records `settlement` (merchant credited for a
 * sale) and `withdrawal` (funds held for a payout request) in addition to the
 * original topup/purchase/refund/adjustment. WalletLedger already takes the
 * type as a free string, so the only blocker was the column's enum constraint.
 * Relaxing it to a plain string keeps the ledger open to future movement types
 * without another migration each time.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('balance_mutations', function (Blueprint $table) {
            $table->string('type')->change();
        });
    }

    public function down(): void
    {
        Schema::table('balance_mutations', function (Blueprint $table) {
            $table->enum('type', ['topup', 'purchase', 'refund', 'adjustment'])->change();
        });
    }
};
