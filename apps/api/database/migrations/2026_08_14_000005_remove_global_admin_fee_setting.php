<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Removes the global admin-fee markup configuration. The payment method's own
 * fee (payment_channels.fee_flat + fee_percent) IS the "Biaya Admin" charged to
 * the customer, so a second markup on top was double-counting.
 *
 * This drops configuration only, never history: `transactions.admin_markup` and
 * `payments.admin_markup` are deliberately left in place. They are the only
 * record of how a historical `amount_fee` split between the channel's cost and
 * kita's markup, and the platform ledger has already booked profit from that
 * split — dropping them would make settled balances unreconstructable. Both
 * columns stay NOT NULL DEFAULT 0 and are written as 0 from now on.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('settings')->whereIn('key', ['admin_fee_type', 'admin_fee_value'])->delete();
    }

    public function down(): void
    {
        $now = now();

        DB::table('settings')->insertOrIgnore([
            [
                'group' => 'payment',
                'key' => 'admin_fee_type',
                'value' => 'fixed',
                'type' => 'string',
                'label' => 'Tipe Biaya Admin',
                'is_public' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'group' => 'payment',
                'key' => 'admin_fee_value',
                'value' => '0',
                'type' => 'number',
                'label' => 'Nilai Biaya Admin',
                'is_public' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }
};
