<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bukti transfer for a manually-settled withdrawal.
 *
 * When kita transfers the payout out-of-band, the finance operator uploads the
 * transfer receipt at approval time. `proof_path` is the stored path on the
 * `public` disk; the API exposes it as an absolute URL.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('withdrawals', function (Blueprint $table) {
            $table->string('proof_path')->nullable()->after('disbursement_ref');
        });
    }

    public function down(): void
    {
        Schema::table('withdrawals', function (Blueprint $table) {
            $table->dropColumn('proof_path');
        });
    }
};
