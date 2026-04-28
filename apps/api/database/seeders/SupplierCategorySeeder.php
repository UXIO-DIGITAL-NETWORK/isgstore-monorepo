<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SupplierCategorySeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $items = [];

        // Map all game categories (1-8) to Digiflazz (supplier 1)
        $codes = [1=>'mlbb',2=>'genshin',3=>'freefire',4=>'pubgm',5=>'hsr',6=>'aov',7=>'coc',8=>'stumble-guys'];
        foreach ($codes as $catId => $code) {
            $items[] = ['category_id'=>$catId,'supplier_id'=>1,'template_code'=>$code,'created_at'=>$now,'updated_at'=>$now];
        }
        // Map PC game categories (9-12) to Digiflazz
        $pcCodes = [9=>'valorant',10=>'steam',11=>'lol-wr',12=>'roblox'];
        foreach ($pcCodes as $catId => $code) {
            $items[] = ['category_id'=>$catId,'supplier_id'=>1,'template_code'=>$code,'created_at'=>$now,'updated_at'=>$now];
        }
        // Map voucher categories (16-19) to VIP Reseller (supplier 2)
        $voucherCodes = [16=>'google-play',17=>'itunes',18=>'netflix',19=>'spotify'];
        foreach ($voucherCodes as $catId => $code) {
            $items[] = ['category_id'=>$catId,'supplier_id'=>2,'template_code'=>$code,'created_at'=>$now,'updated_at'=>$now];
        }
        // Map e-wallet categories (20-25) to Internal System (supplier 3)
        for ($i = 20; $i <= 25; $i++) {
            $items[] = ['category_id'=>$i,'supplier_id'=>3,'template_code'=>'internal-'.$i,'created_at'=>$now,'updated_at'=>$now];
        }

        DB::table('supplier_categories')->insert($items);
    }
}
