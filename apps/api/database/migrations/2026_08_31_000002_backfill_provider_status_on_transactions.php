<?php

use App\Enums\ProviderStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Give every pre-existing row the provider verdict it always had, just never
 * recorded separately.
 *
 * The rule itself lives in `ProviderStatus::backfillFor()` rather than as SQL here,
 * so it can be unit-tested and so the one subtle case — PROCESSING with no
 * `supplier_trx_id` — is stated once. Without this pass the whole table would read
 * NOT_ORDERED, and the refund queue and the reaper would both be looking at a lie.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('transactions')
            ->select('id', 'status', 'supplier_trx_id', 'supplier_status')
            ->orderBy('id')
            ->chunk(500, function ($rows) {
                // Group by target value so a chunk is a handful of UPDATEs keyed
                // on primary keys, not one round trip per row.
                $byStatus = [];

                foreach ($rows as $row) {
                    $provider = ProviderStatus::backfillFor(
                        (string) $row->status,
                        $row->supplier_trx_id,
                        $row->supplier_status,
                    );

                    $byStatus[$provider->value][] = $row->id;
                }

                foreach ($byStatus as $value => $ids) {
                    DB::table('transactions')->whereIn('id', $ids)->update(['provider_status' => $value]);
                }
            });
    }

    public function down(): void
    {
        // The column is dropped by the sibling migration; nothing to restore.
    }
};
