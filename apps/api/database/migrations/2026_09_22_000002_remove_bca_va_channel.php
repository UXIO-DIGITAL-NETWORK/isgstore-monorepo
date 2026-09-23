<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * BCA Virtual Account is gone: the gateway this site uses does not offer it, so
 * the row has no future and must not reappear.
 *
 * The earlier migration (2026_08_27_000001) only deactivated it, on the reasoning
 * that payments already opened against it had to keep resolving. This is the
 * follow-through, and it is deliberately careful:
 *
 * - The row is DELETED when nothing references it — which is the normal case,
 *   since the channel was never offered.
 * - The row is left DEACTIVATED when something does reference it
 *   (transactions / payments / balance_topups / service_invoice_payments are all
 *   `restrictOnDelete`), because orphaning that history is worse than an inactive
 *   row.
 *
 * Deleting it also settles the admin page: `GET /v1/payment-channels` does not
 * filter `is_active`, so a merely-deactivated row still showed under Metode
 * Pembayaran. And `bca_va` was dropped from `MonetapayContractFees` in the same
 * change, which is what stops `hub:sync-channels` from re-creating it.
 */
return new class extends Migration
{
    private const CODE = 'bca_va';

    /** Money-path tables whose foreign key would block the delete. */
    private const REFERENCING_TABLES = [
        'transactions',
        'payments',
        'balance_topups',
        'service_invoice_payments',
    ];

    public function up(): void
    {
        $id = DB::table('payment_channels')->where('channel_code', self::CODE)->value('id');

        if ($id === null) {
            return;
        }

        foreach (self::REFERENCING_TABLES as $table) {
            if (DB::table($table)->where('payment_channel_id', $id)->exists()) {
                DB::table('payment_channels')->where('id', $id)->update([
                    'is_active' => false,
                    'updated_at' => now(),
                ]);

                return;
            }
        }

        DB::table('payment_channels')->where('id', $id)->delete();
    }

    public function down(): void
    {
        // Restore the row as it stood before this migration: present, inactive,
        // priced as the old seeder priced it.
        DB::table('payment_channels')->upsert([[
            'name' => 'BCA Virtual Account',
            'payment_type' => 'virtual_account',
            'channel_code' => self::CODE,
            'min_amount' => 10000,
            'is_active' => false,
            'is_single_use' => true,
            'fee_flat' => 1900,
            'fee_percent' => 0,
            'gateway_fee_flat' => 1900,
            'gateway_fee_percent' => 0,
            'extra_config' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]], ['channel_code'], [
            'name', 'payment_type', 'min_amount', 'is_active', 'is_single_use',
            'fee_flat', 'fee_percent', 'gateway_fee_flat', 'gateway_fee_percent',
            'extra_config', 'updated_at',
        ]);
    }
};
