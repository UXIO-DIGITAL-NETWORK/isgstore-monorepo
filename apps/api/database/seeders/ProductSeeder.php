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

        // Helper: tiered pricing – modal is base, member +20%, vip +15%, reseller +10%, agent +5%
        $p = function ($catId, $subCatId, $name, $code, $modal) use (&$products, $now) {
            $products[] = [
                'category_id' => $catId,
                'sub_category_id' => $subCatId,
                'name' => $name,
                'code' => $code, // Ini adalah buyer_sku_code
                'price_modal' => $modal,
                'price_member' => (int) ($modal * 1.20),
                'price_vip' => (int) ($modal * 1.15),
                'price_reseller' => (int) ($modal * 1.10),
                'price_agent' => (int) ($modal * 1.05),
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        };

        // GAMES
        $p(1, 1, 'MOBILELEGEND - 5 Diamond', 'ml5', 1375);
        $p(1, 1, 'MOBILELEGEND - 10 Diamond', 'ml10', 2855);
        $p(1, 1, 'MOBILELEGEND - 12 Diamond', 'ml12', 3303);
        $p(1, 2, 'MOBILE LEGENDS Weekly Diamond Pass', 'mlweek', 27997);
        $p(3, 8, 'Free Fire 12 Diamond', 'ff12', 1811);
        $p(3, 8, 'Free Fire 50 Diamond', 'ff50', 6330);
        $p(3, 8, 'Free Fire 70 Diamond', 'ff70', 8955);
        $p(3, 8, 'Free Fire 140 Diamond', 'ff140', 18212);
        $p(3, 8, 'Free Fire 355 Diamond', 'ff355', 44800);
        $p(9, 14, 'Valorant 475 VP', 'val475', 52140);

        // PULSA
        $p(11, 30, 'Axis 5.000', 'ax5', 5899);
        $p(11, 30, 'Axis 10.000', 'ax10', 10865);
        $p(11, 30, 'by.U 10.000', 'byu10', 10355);
        $p(11, 32, 'Indosat 5.000', 'i5', 6685);
        $p(11, 32, 'Indosat 10.000', 'i10', 10850);
        $p(11, 32, 'Indosat 20.000', 'i20', 20565);
        $p(11, 32, 'Indosat 25.000', 'i25', 25155);
        $p(11, 32, 'Indosat 30.000', 'i30', 30575);
        $p(11, 32, 'Indosat 50.000', 'i50', 49616);
        $p(11, 33, 'Telkomsel 5.000', 's5', 5222);
        $p(11, 33, 'Telkomsel 10.000', 's10', 10190);
        $p(11, 33, 'Telkomsel 15.000', 's15', 15010);
        $p(11, 33, 'Telkomsel 20.000', 's20', 19860);
        $p(11, 33, 'Telkomsel 25.000', 's25', 24640);
        $p(11, 33, 'Telkomsel 30.000', 's30', 29825);
        $p(11, 33, 'Telkomsel 50.000', 's50', 49310);
        $p(11, 33, 'Telkomsel 100.000', 's100', 98850);
        $p(11, 34, 'Smartfren 10.000', 'sm10', 10005);
        $p(11, 35, 'Three 5.000', 't5', 5319);
        $p(11, 35, 'Three 10.000', 't10', 11330);
        $p(11, 35, 'Three 20.000', 't20', 20500);
        $p(11, 36, 'Xl 5.000', 'x5', 5865);
        $p(11, 36, 'Xl 10.000', 'x10', 10825);

        // DATA
        $p(12, 40, 'Axis Data SS 2 GB 3 Hari', 'axdss2', 9630);
        $p(12, 40, 'Axis Data Jawa 2.5 GB 5 Hari', 'axdj1', 12960);
        $p(12, 41, 'Indosat Yellow 1 GB 1 Hari', 'yellow1', 5855);
        $p(12, 41, 'Indosat Freedom Internet 3 GB 3 Hari', 'if3g3d', 11905);
        $p(12, 41, 'Indosat Freedom Internet 2.5 GB 5 Hari', 'if2', 13100);
        $p(12, 41, 'Indosat Freedom Internet 3 GB 28 Hari', 'if3g30d', 21210);
        $p(12, 41, 'Indosat Freedom Internet 5.5 GB 28 Hari', 'if5g30d', 34625);
        $p(12, 42, 'Telkomsel Data Flash 1 GB 30 Hari', 'flash1', 11570);
        $p(12, 42, 'Telkomsel Data Flash 3 GB 30 Hari', 'flash3', 21025);
        $p(12, 42, 'Telkomsel Data Flash 2 GB 30 Hari', 'flash2', 26000);
        $p(12, 43, 'XL Xtra Combo Flex S 28 Hari', 'flexs', 31980);
        $p(12, 44, 'Tri Data Happy 1.5 GB 1 Hari', 'happy1', 6505);
        $p(12, 44, 'Tri Data Happy 3 GB 3 Hari', 'happy3', 11680);
        $p(12, 45, 'Smartfren Data Unlimited Harian 1 GB 7 Hari', 'smdu1', 22210);
        $p(12, 45, 'Smartfren Data Unlimited Harian 2 GB 28 Hari', 'smdu2', 91375);

        // E-MONEY
        $p(13, 50, 'Cek Nama Pengguna DANA', 'danacek', 10);
        $p(13, 50, 'DANA 20.000', 'dana20', 20135);
        $p(13, 50, 'DANA 50.000', 'dana50', 50150);
        $p(13, 51, 'Cek Nama Pengguna Gopay', 'gopaycek', 10);
        $p(13, 51, 'Go Pay 50.000', 'go50', 50325);
        $p(13, 51, 'Go Pay 100.000', 'go100', 101000);
        $p(13, 52, 'Cek Nama Pengguna OVO', 'ovocek', 7);
        $p(13, 52, 'OVO 50.000', 'ovo50', 50680);
        $p(13, 52, 'OVO 100.000', 'ovo100', 100605);
        $p(13, 53, 'SHOPEE PAY 50.000', 'shopee50', 50125);
        $p(13, 53, 'SHOPEE PAY 100.000', 'shopee100', 100325);

        // PPOB
        $p(14, 60, 'PLN 20.000', 'pln20', 21800);
        $p(14, 60, 'PLN 50.000', 'pln50', 51805);
        $p(14, 60, 'PLN 100.000', 'pln100', 101985);
        $p(14, 60, 'PLN 1.000.000', 'pln1000', 1001800);
        $p(14, 61, 'K-Vision & GOL Paket CLING (CL01) 30 Hari', 'kvision30d', 19160);
        $p(14, 61, 'K-Vision & GOL Paket CLING (CL06) 180 Hari', 'kvision180d', 81674);
        $p(14, 61, 'Pertagas 20.000', 'pertagas20', 21935);
        $p(14, 62, 'Telkomsel Telepon Pas 10.000', 'pas10', 6510);
        $p(14, 62, 'Telkomsel Telepon Pas 20.000', 'pas20', 15655);
        $p(14, 62, 'Telkomsel Telepon Pas 50.000', 'pas50', 19625);
        $p(14, 63, 'Aktivasi Perdana Axis 3 GB 60 Hari', 'axp3g60d', 13905);
        $p(14, 63, 'Aktivasi Perdana Tri Happy S+ 30 Hari', 'tacthappys', 20500);
        $p(14, 63, 'Indosat Tambah Masa Aktif Kartu 90 Hari', 'iactive90', 32360);
        $p(14, 63, 'Tri Tambah Masa Aktif Kartu 4 Bulan', 'tactive4m', 3480);
        $p(14, 64, 'Aktivasi Voucher Axis 1 GB 1 Hari', 'vax1', 6320);
        $p(14, 64, 'Aktivasi Voucher Axis 3 GB 3 Hari', 'vax2', 10310);
        $p(14, 64, 'Aktivasi Voucher XL XTRA HotRod 3GB', 'hotrod3g10d', 18199);
        $p(14, 64, 'Aktivasi Voucher XL Xtra Combo Flex', 'vflexs', 31908);
        $p(14, 64, 'Voucher Telkomsel 2.5 GB 5 Hari', 'vs2g5d', 12960);

        foreach (array_chunk($products, 100) as $chunk) {
            DB::table('products')->insert($chunk);
        }
    }
}
