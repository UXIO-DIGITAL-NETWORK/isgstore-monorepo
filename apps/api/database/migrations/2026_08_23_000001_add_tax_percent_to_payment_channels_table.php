<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Per-channel tax (PPN) rate on the channel fee. Default 11 so existing
     * channels apply Indonesian PPN immediately; a channel whose fee is 0 still
     * yields 0 tax, so this is safe to backfill.
     */
    public function up(): void
    {
        Schema::table('payment_channels', function (Blueprint $table) {
            $table->decimal('tax_percent', 5, 2)->default(11.00)->after('gateway_fee_percent');
        });
    }

    public function down(): void
    {
        Schema::table('payment_channels', function (Blueprint $table) {
            $table->dropColumn('tax_percent');
        });
    }
};
