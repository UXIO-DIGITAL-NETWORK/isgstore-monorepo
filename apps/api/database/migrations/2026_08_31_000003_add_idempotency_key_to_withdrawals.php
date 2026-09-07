<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Approving or rejecting a withdrawal is safe to repeat: both guard on the row's
 * status, so a replay hits an already-processed row and is refused. CREATING one
 * had no such guard — there is no prior row to check — so a request whose
 * response was lost (a network drop, or the site taking longer than the Hub's
 * 20s timeout to answer) left the caller unable to tell "never happened" from
 * "happened, ack lost". Retrying then withdrew the money twice.
 *
 * The key closes that: the caller mints one per intent and resends it verbatim
 * on a retry, and the unique index makes the second attempt a lookup instead of
 * an insert. Nullable because the on-site panel has a human watching and does
 * not need one; unique rather than a composite, since the caller generates a
 * UUID.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('withdrawals', function (Blueprint $table) {
            $table->string('idempotency_key', 64)->nullable()->unique()->after('withdrawal_number');
        });
    }

    public function down(): void
    {
        Schema::table('withdrawals', function (Blueprint $table) {
            $table->dropUnique(['idempotency_key']);
            $table->dropColumn('idempotency_key');
        });
    }
};
