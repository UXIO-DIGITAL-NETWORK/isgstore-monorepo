<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * BCA Virtual Account is not listed in the Monetapay contract, so its gateway
 * fee could never be verified — profit on that channel was computed from a
 * provisional guess (pinned to the Mandiri rate). Decision (27 Aug 2026):
 * stop offering it. Deactivated, NOT deleted — payments already opened on
 * bca_va must keep resolving, and the row anchors their history.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Guarded on is_active so an operator's later manual state is never
        // overwritten by a re-run.
        DB::table('payment_channels')
            ->where('channel_code', 'bca_va')
            ->where('is_active', true)
            ->update(['is_active' => false, 'updated_at' => now()]);
    }

    public function down(): void
    {
        // Revert only what up() set. If an operator deactivated bca_va for
        // their own reasons before this migration ran, up() was a no-op and
        // this reactivation is still the closest honest inverse we can offer.
        DB::table('payment_channels')
            ->where('channel_code', 'bca_va')
            ->where('is_active', false)
            ->update(['is_active' => true, 'updated_at' => now()]);
    }
};
