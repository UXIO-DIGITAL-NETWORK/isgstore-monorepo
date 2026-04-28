<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $products = [];
        $idx = 0;

        // Helper: tiered pricing – modal is base, member +20%, vip +15%, reseller +10%, agent +5%
        $p = function ($catId, $subCatId, $name, $code, $modal) use (&$products, $now) {
            $products[] = [
                'category_id'    => $catId,
                'sub_category_id'=> $subCatId,
                'name'           => $name,
                'code'           => $code,
                'price_modal'    => $modal,
                'price_member'   => (int)($modal * 1.20),
                'price_vip'      => (int)($modal * 1.15),
                'price_reseller' => (int)($modal * 1.10),
                'price_agent'    => (int)($modal * 1.05),
                'status'         => true,
                'created_at'     => $now,
                'updated_at'     => $now,
            ];
        };

        // MLBB Diamond (cat 1, sub 1)
        $p(1,1,'5 Diamond MLBB','MLBB-5D',1500);
        $p(1,1,'12 Diamond MLBB','MLBB-12D',3600);
        $p(1,1,'19 Diamond MLBB','MLBB-19D',5700);
        $p(1,1,'28 Diamond MLBB','MLBB-28D',8400);
        $p(1,1,'44 Diamond MLBB','MLBB-44D',12500);
        $p(1,1,'59 Diamond MLBB','MLBB-59D',16800);
        $p(1,1,'86 Diamond MLBB','MLBB-86D',24000);
        $p(1,1,'170 Diamond MLBB','MLBB-170D',46000);
        $p(1,1,'240 Diamond MLBB','MLBB-240D',64000);
        $p(1,1,'296 Diamond MLBB','MLBB-296D',79000);
        $p(1,1,'408 Diamond MLBB','MLBB-408D',108000);
        $p(1,1,'568 Diamond MLBB','MLBB-568D',148000);
        $p(1,1,'875 Diamond MLBB','MLBB-875D',228000);
        $p(1,1,'2010 Diamond MLBB','MLBB-2010D',520000);
        // MLBB Weekly Diamond Pass (cat 1, sub 2)
        $p(1,2,'Weekly Diamond Pass','MLBB-WDP',28000);
        // MLBB Starlight (cat 1, sub 3)
        $p(1,3,'Starlight Member','MLBB-SL',145000);
        $p(1,3,'Starlight Plus','MLBB-SLP',350000);

        // Genshin Impact (cat 2, sub 5=Genesis Crystal, sub 6=Welkin)
        $p(2,5,'60 Genesis Crystal','GI-60GC',16000);
        $p(2,5,'300+30 Genesis Crystal','GI-330GC',79000);
        $p(2,5,'980+110 Genesis Crystal','GI-1090GC',249000);
        $p(2,5,'1980+260 Genesis Crystal','GI-2240GC',479000);
        $p(2,5,'3280+600 Genesis Crystal','GI-3880GC',799000);
        $p(2,5,'6480+1600 Genesis Crystal','GI-8080GC',1599000);
        $p(2,6,'Blessing of the Welkin Moon','GI-WELKIN',75000);
        $p(2,7,'Gnostic Hymn','GI-BP',165000);

        // Free Fire (cat 3, sub 8=Diamond)
        $p(3,8,'5 Diamond FF','FF-5D',1200);
        $p(3,8,'12 Diamond FF','FF-12D',2400);
        $p(3,8,'50 Diamond FF','FF-50D',7500);
        $p(3,8,'70 Diamond FF','FF-70D',10000);
        $p(3,8,'140 Diamond FF','FF-140D',20000);
        $p(3,8,'355 Diamond FF','FF-355D',50000);
        $p(3,8,'720 Diamond FF','FF-720D',100000);
        $p(3,8,'2180 Diamond FF','FF-2180D',300000);

        // PUBG Mobile (cat 4, sub 11=UC)
        $p(4,11,'60 UC','PUBGM-60UC',15000);
        $p(4,11,'325 UC','PUBGM-325UC',75000);
        $p(4,11,'660 UC','PUBGM-660UC',149000);
        $p(4,11,'1800 UC','PUBGM-1800UC',379000);
        $p(4,11,'3850 UC','PUBGM-3850UC',779000);
        $p(4,11,'8100 UC','PUBGM-8100UC',1559000);

        // Valorant (cat 9, sub 14=VP)
        $p(9,14,'125 VP','VAL-125VP',15000);
        $p(9,14,'420 VP','VAL-420VP',50000);
        $p(9,14,'700 VP','VAL-700VP',80000);
        $p(9,14,'1375 VP','VAL-1375VP',150000);
        $p(9,14,'2400 VP','VAL-2400VP',250000);
        $p(9,14,'4000 VP','VAL-4000VP',400000);
        $p(9,14,'8150 VP','VAL-8150VP',800000);

        // Steam Wallet (cat 10, sub 16-21)
        $p(10,16,'Steam Wallet IDR 12.000','STEAM-12K',12000);
        $p(10,17,'Steam Wallet IDR 45.000','STEAM-45K',45000);
        $p(10,18,'Steam Wallet IDR 60.000','STEAM-60K',60000);
        $p(10,19,'Steam Wallet IDR 90.000','STEAM-90K',90000);
        $p(10,20,'Steam Wallet IDR 120.000','STEAM-120K',120000);
        $p(10,21,'Steam Wallet IDR 250.000','STEAM-250K',250000);

        // Google Play (cat 16, sub 22-27)
        $p(16,22,'Google Play IDR 20.000','GPLAY-20K',20000);
        $p(16,23,'Google Play IDR 50.000','GPLAY-50K',50000);
        $p(16,24,'Google Play IDR 100.000','GPLAY-100K',100000);
        $p(16,25,'Google Play IDR 150.000','GPLAY-150K',150000);
        $p(16,26,'Google Play IDR 300.000','GPLAY-300K',300000);
        $p(16,27,'Google Play IDR 500.000','GPLAY-500K',500000);

        DB::table('products')->insert($products);
    }
}
