<?php

namespace Database\Seeders;

use App\Models\Promo;
use Illuminate\Database\Seeder;

/**
 * Discount codes.
 *
 * Two are public (they appear in the storefront's voucher list), two are not —
 * a code the customer must already know would not be a code at all if it were
 * advertised.
 */
class PromoSeeder extends Seeder
{
    public function run(): void
    {
        $promos = [
            [
                'code' => 'HEMAT10',
                'name' => 'Diskon 10% Semua Game',
                'description' => 'Potongan 10% untuk semua transaksi, maksimal Rp 10.000.',
                'type' => 'percentage',
                'value' => 10,
                'max_discount' => 10000,
                'min_purchase' => 20000,
                'quota_total' => 1000,
                'quota_per_user' => 3,
                'is_public' => true,
            ],
            [
                'code' => 'NEWBIE5K',
                'name' => 'Potongan Rp 5.000 Pengguna Baru',
                'description' => 'Potongan langsung Rp 5.000 untuk transaksi pertama.',
                'type' => 'fixed',
                'value' => 5000,
                'max_discount' => null,
                'min_purchase' => 25000,
                'quota_total' => 500,
                'quota_per_user' => 1,
                'is_public' => true,
            ],
            [
                'code' => 'GAJIAN20',
                'name' => 'Promo Gajian 20%',
                'description' => 'Potongan 20% khusus periode gajian, maksimal Rp 25.000.',
                'type' => 'percentage',
                'value' => 20,
                'max_discount' => 25000,
                'min_purchase' => 50000,
                'quota_total' => 200,
                'quota_per_user' => 1,
                'is_public' => false,
            ],
            [
                'code' => 'RESELLER15',
                'name' => 'Diskon Reseller 15%',
                'description' => 'Potongan khusus reseller terdaftar.',
                'type' => 'percentage',
                'value' => 15,
                'max_discount' => 50000,
                'min_purchase' => 100000,
                'quota_total' => null,
                'quota_per_user' => null,
                'is_public' => false,
            ],
        ];

        foreach ($promos as $promo) {
            Promo::updateOrCreate(
                ['code' => $promo['code']],
                $promo + [
                    'scope' => 'global',
                    'starts_at' => now()->subDays(7),
                    'ends_at' => now()->addDays(30),
                    'is_active' => true,
                ],
            );
        }
    }
}
