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
            ['name' => 'Digiflazz'],
            ['status' => true, 'created_at' => $now, 'updated_at' => $now]
        );
        $digiflazzId = DB::table('suppliers')->where('name', 'Digiflazz')->value('id');

        // 2. CATEGORY TYPES
        DB::table('category_types')->updateOrInsert(
            ['name' => 'Mobile Game'],
            ['status' => true, 'created_at' => $now, 'updated_at' => $now]
        );
        DB::table('category_types')->updateOrInsert(
            ['name' => 'Pulsa & Data'],
            ['status' => true, 'created_at' => $now, 'updated_at' => $now]
        );

        $gameTypeId = DB::table('category_types')->where('name', 'Mobile Game')->value('id');
        $pulsaTypeId = DB::table('category_types')->where('name', 'Pulsa & Data')->value('id');

        // 3. CATEGORIES
        DB::table('categories')->updateOrInsert(
            ['code' => 'mlbb'],
            ['type_id' => $gameTypeId, 'name' => 'Mobile Legends', 'status' => true, 'created_at' => $now, 'updated_at' => $now]
        );
        DB::table('categories')->updateOrInsert(
            ['code' => 'telkomsel'],
            ['type_id' => $pulsaTypeId, 'name' => 'Telkomsel Promo', 'status' => true, 'created_at' => $now, 'updated_at' => $now]
        );

        $mlbbCatId = DB::table('categories')->where('code', 'mlbb')->value('id');
        $tselCatId = DB::table('categories')->where('code', 'telkomsel')->value('id');

        // 4. SUB CATEGORIES
        DB::table('sub_categories')->updateOrInsert(
            ['category_id' => $mlbbCatId, 'name' => 'Diamond'],
            ['status' => true, 'created_at' => $now, 'updated_at' => $now]
        );
        DB::table('sub_categories')->updateOrInsert(
            ['category_id' => $tselCatId, 'name' => 'Pulsa Reguler'],
            ['status' => true, 'created_at' => $now, 'updated_at' => $now]
        );

        $mlbbSubId = DB::table('sub_categories')->where('category_id', $mlbbCatId)->where('name', 'Diamond')->value('id');
        $tselSubId = DB::table('sub_categories')->where('category_id', $tselCatId)->where('name', 'Pulsa Reguler')->value('id');

        // 5. PRODUCTS
        DB::table('products')->updateOrInsert(
            ['code' => 'MLBB-86D'],
            ['category_id' => $mlbbCatId, 'sub_category_id' => $mlbbSubId, 'name' => '86 Diamonds', 'price_modal' => 12000, 'price_member' => 14000, 'price_vip' => 13500, 'price_reseller' => 13000, 'price_agent' => 12500, 'status' => true, 'created_at' => $now, 'updated_at' => $now]
        );
        DB::table('products')->updateOrInsert(
            ['code' => 'MLBB-172D'],
            ['category_id' => $mlbbCatId, 'sub_category_id' => $mlbbSubId, 'name' => '172 Diamonds', 'price_modal' => 24000, 'price_member' => 28000, 'price_vip' => 27000, 'price_reseller' => 26000, 'price_agent' => 25000, 'status' => true, 'created_at' => $now, 'updated_at' => $now]
        );
        DB::table('products')->updateOrInsert(
            ['code' => 'TSEL-5K'],
            ['category_id' => $tselCatId, 'sub_category_id' => $tselSubId, 'name' => 'Pulsa Telkomsel 5,000', 'price_modal' => 5150, 'price_member' => 6000, 'price_vip' => 5800, 'price_reseller' => 5500, 'price_agent' => 5300, 'status' => true, 'created_at' => $now, 'updated_at' => $now]
        );

        $mlbb86Id = DB::table('products')->where('code', 'MLBB-86D')->value('id');
        $mlbb172Id = DB::table('products')->where('code', 'MLBB-172D')->value('id');
        $tsel5kId = DB::table('products')->where('code', 'TSEL-5K')->value('id');

        // 6. SUPPLIER PRODUCTS (Mapping)
        DB::table('supplier_products')->updateOrInsert(
            ['buyer_sku_code' => 'mlbb86', 'supplier_id' => $digiflazzId],
            ['product_id' => $mlbb86Id, 'price' => 12000, 'buyer_product_status' => true, 'seller_product_status' => true, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now]
        );
        DB::table('supplier_products')->updateOrInsert(
            ['buyer_sku_code' => 'mlbb172', 'supplier_id' => $digiflazzId],
            ['product_id' => $mlbb172Id, 'price' => 24000, 'buyer_product_status' => true, 'seller_product_status' => true, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now]
        );
        DB::table('supplier_products')->updateOrInsert(
            ['buyer_sku_code' => 's5', 'supplier_id' => $digiflazzId],
            ['product_id' => $tsel5kId, 'price' => 5150, 'buyer_product_status' => true, 'seller_product_status' => true, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now]
        );
    }
}
