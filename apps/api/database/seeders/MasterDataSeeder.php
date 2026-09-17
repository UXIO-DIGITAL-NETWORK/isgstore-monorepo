<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MasterDataSeeder extends Seeder
{
    /**
     * Idempotent safety net for the master data the integration cannot run
     * without — currently just the Uxiotopup supplier.
     *
     * `CreateUxiolabsProductAction` and `CheckUxiolabsPricesAction` both resolve
     * it through `App\Support\Uxiolabs\UxiolabsSupplier` (which matches the current
     * name and the pre-rename one), so a missing row is a 500 on the price checker
     * and on every SKU import. It is repeated here rather than left to
     * SupplierSeeder because SupplierSeeder uses a raw insert with fixed ids — it
     * cannot run twice, and it does not run at all on an install that was seeded
     * before Digiflazz was renamed.
     *
     * Catalogue master data (game type, category, sub-category) used to be
     * re-created here as a safety net. It is not any more: it would have put back
     * the Mobile Legends rows the seeder now deliberately leaves out.
     */
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('suppliers')->updateOrInsert(
            ['name' => 'Uxiotopup'],
            ['status' => true, 'created_at' => $now, 'updated_at' => $now]
        );
    }
}
