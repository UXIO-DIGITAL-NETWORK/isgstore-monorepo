<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * How the Hub plan line behind this bill is billed.
 *
 * `billed`   — an ordinary period; paying it opens a subscription window.
 * `one_time` — a setup fee. Paying it settles the bill and NOTHING else: no
 *              subscription, no installation, no licence extension.
 * `prepaid`  — recorded as settled outside the system (see ApplyHubPlanAction).
 *
 * The distinction has to live on the invoice, because that is what the payment
 * path holds when it decides whether to open a subscription — and a setup fee
 * that silently started a recurring window would be a free service.
 *
 * Nullable for the bills issued before this column existed: null reads as
 * `billed`, which is what they were.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_invoices', function (Blueprint $table) {
            $table->string('billing_mode', 20)->nullable()->after('source');
        });
    }

    public function down(): void
    {
        Schema::table('service_invoices', function (Blueprint $table) {
            $table->dropColumn('billing_mode');
        });
    }
};
