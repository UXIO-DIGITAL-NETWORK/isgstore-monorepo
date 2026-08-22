<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MasterDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();

        // 1. SUPPLIERS
        DB::table('suppliers')->updateOrInsert(
            ['name' => 'Uxiotopup'],
            ['status' => true, 'created_at' => $now, 'updated_at' => $now]
        );
        $uxiotopupId = DB::table('suppliers')->where('name', 'Uxiotopup')->value('id');

        // 2. CATEGORY TYPES (games only)
        DB::table('category_types')->updateOrInsert(
            ['name' => 'Mobile Game'],
            ['is_voucher' => false, 'status' => true, 'created_at' => $now, 'updated_at' => $now]
        );

        $gameTypeId = DB::table('category_types')->where('name', 'Mobile Game')->value('id');

        // 3. CATEGORIES — updateOrInsert keeps the slug/fields seeded by CategorySeeder.
        DB::table('categories')->updateOrInsert(
            ['code' => 'mlbb'],
            ['type_id' => $gameTypeId, 'name' => 'Mobile Legends', 'status' => true, 'updated_at' => $now]
        );

        $mlbbCatId = DB::table('categories')->where('code', 'mlbb')->value('id');

        // 4. SUB CATEGORIES
        DB::table('sub_categories')->updateOrInsert(
            ['category_id' => $mlbbCatId, 'name' => 'Diamond'],
            ['status' => true, 'updated_at' => $now]
        );

        $mlbbSubId = DB::table('sub_categories')->where('category_id', $mlbbCatId)->where('name', 'Diamond')->value('id');

        // 5. PRODUCTS (extra Mobile Legends denominations)
        DB::table('products')->updateOrInsert(
            ['code' => 'MLBB-86D'],
            ['category_id' => $mlbbCatId, 'sub_category_id' => $mlbbSubId, 'name' => '86 Diamonds', 'price_modal' => 12000, 'price_member' => 14000, 'price_vip' => 13500, 'price_reseller' => 13000, 'price_agent' => 12500, 'status' => true, 'created_at' => $now, 'updated_at' => $now]
        );
        DB::table('products')->updateOrInsert(
            ['code' => 'MLBB-172D'],
            ['category_id' => $mlbbCatId, 'sub_category_id' => $mlbbSubId, 'name' => '172 Diamonds', 'price_modal' => 24000, 'price_member' => 28000, 'price_vip' => 27000, 'price_reseller' => 26000, 'price_agent' => 25000, 'status' => true, 'created_at' => $now, 'updated_at' => $now]
        );

        $mlbb86Id = DB::table('products')->where('code', 'MLBB-86D')->value('id');
        $mlbb172Id = DB::table('products')->where('code', 'MLBB-172D')->value('id');

        // 6. SUPPLIER PRODUCTS (Mapping)
        DB::table('supplier_products')->updateOrInsert(
            ['buyer_sku_code' => 'mlbb86', 'supplier_id' => $uxiotopupId],
            ['product_id' => $mlbb86Id, 'price' => 12000, 'buyer_product_status' => true, 'seller_product_status' => true, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now]
        );
        DB::table('supplier_products')->updateOrInsert(
            ['buyer_sku_code' => 'mlbb172', 'supplier_id' => $uxiotopupId],
            ['product_id' => $mlbb172Id, 'price' => 24000, 'buyer_product_status' => true, 'seller_product_status' => true, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now]
        );
    }
}
