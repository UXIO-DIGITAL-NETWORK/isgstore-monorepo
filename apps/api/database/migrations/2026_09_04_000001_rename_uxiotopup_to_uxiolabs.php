<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The supplier is now called Uxiolabs. Two stored values carry the old name and
 * are looked up by it, so both have to move with the code:
 *
 *  1. `suppliers.name` — the whole provider pipeline resolves the supplier row
 *     by NAME (see App\Support\Uxiolabs\UxiolabsSupplier). Miss this and the
 *     price checker, balance call and every order find no supplier at all.
 *  2. `integration_credentials.provider` — the key config/integrations.php uses
 *     to overlay DB credentials onto `services.uxiolabs`. Miss this and the
 *     saved API key silently stops being applied and the env value takes over.
 *
 * Deliberately untouched: `supplier_products.buyer_sku_code` and
 * `transactions.supplier_trx_id` are the provider's own identifiers, not ours.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('suppliers')->where('name', 'Uxiotopup')->update(['name' => 'Uxiolabs']);

        if (Schema::hasTable('integration_credentials')) {
            DB::table('integration_credentials')
                ->where('provider', 'uxiotopup')
                ->update(['provider' => 'uxiolabs']);
        }
    }

    public function down(): void
    {
        DB::table('suppliers')->where('name', 'Uxiolabs')->update(['name' => 'Uxiotopup']);

        if (Schema::hasTable('integration_credentials')) {
            DB::table('integration_credentials')
                ->where('provider', 'uxiolabs')
                ->update(['provider' => 'uxiotopup']);
        }
    }
};
