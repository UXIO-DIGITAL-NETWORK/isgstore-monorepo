<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tax (PPN) frozen onto each transaction: `tax_amount` is the rupiah tax on
     * the channel fee, `tax_percent` the rate at checkout time. Default 0 so
     * historical rows carry no tax.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->bigInteger('tax_amount')->default(0)->after('amount_fee');
            $table->decimal('tax_percent', 5, 2)->default(0)->after('tax_amount');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn(['tax_amount', 'tax_percent']);
        });
    }
};
