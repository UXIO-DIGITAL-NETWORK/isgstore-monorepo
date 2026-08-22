<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MasterDataSeeder extends Seeder
{
    /**
     * Idempotent safety net for the core master data (supplier, game type,
     * mlbb category + its Diamond sub-category). Products and their supplier
     * mappings are owned by ProductSeeder / SupplierProductSeeder using the real
     * uxiotopup Mobile Legends catalogue — nothing is seeded here.
     */
    public function run(): void
    {
        $now = Carbon::now();

        // 1. SUPPLIER
        DB::table('suppliers')->updateOrInsert(
            ['name' => 'Uxiotopup'],
            ['status' => true, 'created_at' => $now, 'updated_at' => $now]
        );

        // 2. CATEGORY TYPE (games only)
        DB::table('category_types')->updateOrInsert(
            ['name' => 'Mobile Game'],
            ['is_voucher' => false, 'status' => true, 'created_at' => $now, 'updated_at' => $now]
        );
        $gameTypeId = DB::table('category_types')->where('name', 'Mobile Game')->value('id');

        // 3. CATEGORY — updateOrInsert keeps the slug/fields seeded by CategorySeeder.
        DB::table('categories')->updateOrInsert(
            ['code' => 'mlbb'],
            ['type_id' => $gameTypeId, 'name' => 'Mobile Legends', 'status' => true, 'updated_at' => $now]
        );
        $mlbbCatId = DB::table('categories')->where('code', 'mlbb')->value('id');

        // 4. SUB CATEGORY
        DB::table('sub_categories')->updateOrInsert(
            ['category_id' => $mlbbCatId, 'name' => 'Diamond'],
            ['status' => true, 'updated_at' => $now]
        );
    }
}
