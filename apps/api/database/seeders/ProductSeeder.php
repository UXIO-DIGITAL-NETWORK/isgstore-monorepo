<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Services\PricingService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // mlbb is the only seeded game (Mobile Legends catalogue). Resolve by code
        // so a shifted category id never breaks the seed.
        $mlbbCategoryId = Category::where('code', 'mlbb')->value('id');
        $pricing = app(PricingService::class);

        $rows = [];
        foreach (self::services() as $service) {
            // Selling prices derived from cost via the shared markup rules
            // (member +20 / vip +15 / reseller +10 / agent +5, seeded by
            // PricingRuleSeeder which runs before this seeder).
            $prices = $pricing->computePrices((int) $service['cost'], $mlbbCategoryId);

            $rows[] = [
                'category_id' => $mlbbCategoryId,
                'sub_category_id' => $service['sub'],
                'name' => $service['name'],
                'code' => $service['id'], // = uxiotopup service id = buyer_sku_code
                'price_modal' => $prices['price_modal'],
                'price_member' => $prices['price_member'],
                'price_vip' => $prices['price_vip'],
                'price_reseller' => $prices['price_reseller'],
                'price_agent' => $prices['price_agent'],
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            DB::table('products')->insert($chunk);
        }
    }

    /**
     * Real uxiotopup Mobile Legends price-list (service id = code = buyer_sku_code).
     * Shared with SupplierProductSeeder so cost/availability stay in one place.
     *
     * sub: 1 = Diamond, 2 = Membership/Pass (mlbb sub_categories).
     * available: false ⇒ supplier mapping seeded inactive (not sellable until the
     * 5-minute price checker or an admin flips it on).
     *
     * @return array<int,array{id:string,name:string,sub:int,cost:int,available:bool}>
     */
    public static function services(): array
    {
        return [
            // ── Mobile Legends Indonesia (S1) ──────────────────────────────
            ['id' => 'MLID_FT50_S1', 'name' => '50 + 50 (First Top-Up Bonus)', 'sub' => 1, 'cost' => 16297, 'available' => true],
            ['id' => 'MLID_FT150_S1', 'name' => '150 + 150 (First Top-Up Bonus)', 'sub' => 1, 'cost' => 48661, 'available' => true],
            ['id' => 'MLID_FT250_S1', 'name' => '250 + 250 (First Top-Up Bonus)', 'sub' => 1, 'cost' => 81254, 'available' => true],
            ['id' => 'MLID_FT500_S1', 'name' => '500 + 500 (First Top-Up Bonus)', 'sub' => 1, 'cost' => 163463, 'available' => true],
            ['id' => 'MLID_4026_S1', 'name' => '3383 + 643 Diamonds', 'sub' => 1, 'cost' => 1141824, 'available' => true],
            ['id' => 'MLID_758_S1', 'name' => '671 + 87 Diamonds', 'sub' => 1, 'cost' => 228283, 'available' => false],
            ['id' => 'MLID_366_S1', 'name' => '333 + 33 Diamonds', 'sub' => 1, 'cost' => 114165, 'available' => false],
            ['id' => 'MLID_184_S1', 'name' => '167 + 17 Diamonds', 'sub' => 1, 'cost' => 57083, 'available' => false],
            ['id' => 'MLID_83_S1', 'name' => '75 + 8 Diamonds', 'sub' => 1, 'cost' => 25674, 'available' => false],
            ['id' => 'MLID_74_S1', 'name' => '67 + 7 Diamonds', 'sub' => 1, 'cost' => 22897, 'available' => true],
            ['id' => 'MLID_45_S1', 'name' => '45 Diamonds', 'sub' => 1, 'cost' => 15523, 'available' => false],
            ['id' => 'MLID_4830_S1', 'name' => '4003 + 827 Diamonds', 'sub' => 1, 'cost' => 1310885, 'available' => true],
            ['id' => 'MLID_2010_S1', 'name' => '1708 + 302 Diamonds', 'sub' => 1, 'cost' => 546332, 'available' => true],
            ['id' => 'MLID_875_S1', 'name' => '774 + 101 Diamonds', 'sub' => 1, 'cost' => 251225, 'available' => true],
            ['id' => 'MLID_568_S1', 'name' => '503 + 65 Diamonds', 'sub' => 1, 'cost' => 163964, 'available' => true],
            ['id' => 'MLID_408_S1', 'name' => '367 + 41 Diamonds', 'sub' => 1, 'cost' => 120173, 'available' => true],
            ['id' => 'MLID_296_S1', 'name' => '256 + 40 Diamonds', 'sub' => 1, 'cost' => 87672, 'available' => true],
            ['id' => 'MLID_240_S1', 'name' => '217 + 23 Diamonds', 'sub' => 1, 'cost' => 70966, 'available' => true],
            ['id' => 'MLID_170_S1', 'name' => '154 + 16 Diamonds', 'sub' => 1, 'cost' => 50209, 'available' => true],
            ['id' => 'MLID_85_S1', 'name' => '77 + 8 Diamonds', 'sub' => 1, 'cost' => 25219, 'available' => true],
            ['id' => 'MLID_59_S1', 'name' => '53 + 6 Diamonds', 'sub' => 1, 'cost' => 17435, 'available' => true],
            ['id' => 'MLID_44_S1', 'name' => '40 + 4 Diamonds', 'sub' => 1, 'cost' => 13156, 'available' => true],
            ['id' => 'MLID_28_S1', 'name' => '25 + 3 Diamonds', 'sub' => 1, 'cost' => 8786, 'available' => true],
            ['id' => 'MLID_19_S1', 'name' => '17 + 2 Diamonds', 'sub' => 1, 'cost' => 6055, 'available' => true],
            ['id' => 'MLID_5_S1', 'name' => '5 Diamonds', 'sub' => 1, 'cost' => 1548, 'available' => true],
            ['id' => 'MLID_12_S1', 'name' => '12 Diamonds', 'sub' => 1, 'cost' => 3915, 'available' => true],
            ['id' => 'MLID_WP_S1', 'name' => 'Weekly Pass', 'sub' => 2, 'cost' => 31500, 'available' => true],
            ['id' => 'MLID_TP_S1', 'name' => 'Twilight Pass', 'sub' => 2, 'cost' => 164282, 'available' => false],
            ['id' => 'MLID_5-2_S1', 'name' => '10 Diamonds', 'sub' => 1, 'cost' => 3096, 'available' => true],
            ['id' => 'MLID_WP-2_S1', 'name' => 'Weekly Pass x2', 'sub' => 2, 'cost' => 63000, 'available' => true],
            ['id' => 'MLID_WP-3_S1', 'name' => 'Weekly Pass x3', 'sub' => 2, 'cost' => 94500, 'available' => true],
            ['id' => 'MLID_WP-4_S1', 'name' => 'Weekly Pass x4', 'sub' => 2, 'cost' => 126000, 'available' => true],
            ['id' => 'MLID_WP-5_S1', 'name' => 'Weekly Pass x5', 'sub' => 2, 'cost' => 157500, 'available' => true],
            // ── Mobile Legends Indonesia (S5) ──────────────────────────────
            ['id' => 'MLID_WDP_S5', 'name' => 'Weekly Diamond Pass (One Weekly)', 'sub' => 2, 'cost' => 30881, 'available' => true],
            ['id' => 'MLID_5_S5', 'name' => '5 Diamond (5 + 0 Bonus)', 'sub' => 1, 'cost' => 1718, 'available' => true],
            ['id' => 'MLID_12_S5', 'name' => '12 Diamond (12 + 0 Bonus)', 'sub' => 1, 'cost' => 4220, 'available' => true],
            ['id' => 'MLID_19_S5', 'name' => '19 Diamond (17 + 2 Bonus)', 'sub' => 1, 'cost' => 5467, 'available' => true],
            ['id' => 'MLID_28_S5', 'name' => '28 Diamond (25 + 3 Bonus)', 'sub' => 1, 'cost' => 9424, 'available' => true],
            ['id' => 'MLID_44_S5', 'name' => '44 Diamond (40 + 4 Bonus)', 'sub' => 1, 'cost' => 14191, 'available' => true],
            ['id' => 'MLID_59_S5', 'name' => '59 Diamond (53 + 6 Bonus)', 'sub' => 1, 'cost' => 18254, 'available' => true],
            ['id' => 'MLID_74_S5', 'name' => '74 Diamond (67 + 7 Bonus)', 'sub' => 1, 'cost' => 23825, 'available' => true],
            ['id' => 'MLID_85_S5', 'name' => '85 Diamond (77 + 8 Bonus)', 'sub' => 1, 'cost' => 27117, 'available' => true],
            ['id' => 'MLID_170_S5', 'name' => '170 Diamond (154 + 16 Bonus)', 'sub' => 1, 'cost' => 54021, 'available' => true],
            ['id' => 'MLID_240_S5', 'name' => '240 Diamond (217 + 23 Bonus)', 'sub' => 1, 'cost' => 76277, 'available' => true],
            ['id' => 'MLID_296_S5', 'name' => '296 Diamond (256 + 40 Bonus)', 'sub' => 1, 'cost' => 93865, 'available' => true],
            ['id' => 'MLID_408_S5', 'name' => '408 Diamond (367 + 41 Bonus)', 'sub' => 1, 'cost' => 129672, 'available' => true],
            ['id' => 'MLID_568_S5', 'name' => '568 Diamond (503 + 65 Bonus)', 'sub' => 1, 'cost' => 176501, 'available' => true],
            ['id' => 'MLID_875_S5', 'name' => '875 Diamond (774 + 101 Bonus)', 'sub' => 1, 'cost' => 270805, 'available' => true],
            ['id' => 'MLID_2010_S5', 'name' => '2010 Diamond (1708 + 302 Bonus)', 'sub' => 1, 'cost' => 612585, 'available' => true],
            ['id' => 'MLID_4830_S5', 'name' => '4830 Diamond (4003 + 827 Bonus)', 'sub' => 1, 'cost' => 1470035, 'available' => true],
            // ── Mobile Legends Indonesia Promo (S6) ────────────────────────
            ['id' => 'MLID_75_S6', 'name' => '75 + 8 Diamonds', 'sub' => 1, 'cost' => 22365, 'available' => true],
            ['id' => 'MLID_167_S6', 'name' => '167 + 17 Diamonds', 'sub' => 1, 'cost' => 47618, 'available' => true],
            ['id' => 'MLID_333_S6', 'name' => '333 + 33 Diamonds', 'sub' => 1, 'cost' => 96758, 'available' => true],
            ['id' => 'MLID_671_S6', 'name' => '671 + 87 Diamonds', 'sub' => 1, 'cost' => 197348, 'available' => true],
            ['id' => 'MLID_1708_S6', 'name' => '1708 + 302 Diamonds', 'sub' => 1, 'cost' => 486150, 'available' => true],
            ['id' => 'MLID_3383_S6', 'name' => '3383 + 643 Diamonds', 'sub' => 1, 'cost' => 982800, 'available' => true],
        ];
    }
}
