<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Supplier swap Digiflazz → uxiotopup (data only, no schema change).
 *
 *  1. Rename the supplier row so 'Uxiotopup' lookups (price checker, balances)
 *     resolve on an existing database.
 *  2. Clear supplier-backed nickname checks: uxiotopup has no cek-username
 *     endpoint, so `digiflazz:{sku}` / `product:{id}` providers can never
 *     resolve again. URL-based providers are left untouched.
 *  3. Rewrite the mlbb-style customer_no template to uxiotopup's pipe format
 *     ("dataId|zoneId"). Only the exact legacy value is touched, so an
 *     admin-customized template survives.
 *
 * NOTE: supplier_products.buyer_sku_code still holds Digiflazz SKUs on an
 * existing database — remap them to uxiotopup service ids manually (run
 * `uxiotopup:sync-products` to see which codes are unknown).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('suppliers')
            ->where('name', 'Digiflazz')
            ->update(['name' => 'Uxiotopup']);

        DB::table('categories')
            ->where('validasi_nickname', 'like', 'digiflazz:%')
            ->orWhere('validasi_nickname', 'like', 'product:%')
            ->update(['validasi_nickname' => null]);

        $this->replaceTemplate('{user_id}{zone_id}', '{user_id}|{zone_id}');
    }

    public function down(): void
    {
        DB::table('suppliers')
            ->where('name', 'Uxiotopup')
            ->update(['name' => 'Digiflazz']);

        // validasi_nickname values are not restorable — data was cleared.

        $this->replaceTemplate('{user_id}|{zone_id}', '{user_id}{zone_id}');
    }

    private function replaceTemplate(string $from, string $to): void
    {
        // order_form_fields is JSON; rewrite via PHP so this works on every
        // driver (sqlite in tests, mysql in prod) without JSON_SET quirks.
        DB::table('categories')
            ->whereNotNull('order_form_fields')
            ->get(['id', 'order_form_fields'])
            ->each(function ($row) use ($from, $to) {
                $schema = json_decode($row->order_form_fields, true);

                if (! is_array($schema) || ($schema['customer_no_template'] ?? null) !== $from) {
                    return;
                }

                $schema['customer_no_template'] = $to;

                DB::table('categories')
                    ->where('id', $row->id)
                    ->update(['order_form_fields' => json_encode($schema)]);
            });
    }
};
