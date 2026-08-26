<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Internal ("kita") withdrawals reuse the same withdrawals table and flow as
 * merchant payouts — same status machine, same approve/reject actions, same
 * disbursement job — but have no merchant. `merchant_id` becomes nullable to
 * carry those rows; `requested_by` records which internal user created the
 * request, distinct from `approved_by` (who verified it — may be someone
 * else, or the same person self-verifying).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('withdrawals', function (Blueprint $table) {
            $table->foreignId('merchant_id')->nullable()->change();
            $table->foreignId('requested_by')->nullable()->after('merchant_id')
                ->constrained('users')->nullOnDelete();

            $table->index(['requested_by', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('withdrawals', function (Blueprint $table) {
            $table->dropConstrainedForeignId('requested_by');
            $table->foreignId('merchant_id')->nullable(false)->change();
        });
    }
};
