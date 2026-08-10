<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // Games only — this is a game top-up platform. `slug` is required for the
        // storefront's slug-based URLs (Catalog::resolveGame); `order_form_fields`
        // is filled per game by OrderFormSchemaSeeder, which runs after this.
        $categories = [
            [
                'id' => 1, 'type_id' => 1, 'name' => 'Mobile Legends', 'sub_name' => 'Bang Bang',
                'code' => 'mlbb', 'slug' => 'mobile-legends', 'validasi_nickname' => null,
                'region' => 'ID', 'logo' => null, 'thumbnail' => null, 'banner' => null,
                'description' => 'Top up Diamond Mobile Legends: Bang Bang, cepat dan aman.',
                'status' => true, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 3, 'type_id' => 1, 'name' => 'Free Fire', 'sub_name' => null,
                'code' => 'freefire', 'slug' => 'free-fire', 'validasi_nickname' => null,
                'region' => 'ID', 'logo' => null, 'thumbnail' => null, 'banner' => null,
                'description' => 'Top up Diamond Free Fire langsung ke akun kamu.',
                'status' => true, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => 9, 'type_id' => 2, 'name' => 'Valorant', 'sub_name' => null,
                'code' => 'valorant', 'slug' => 'valorant', 'validasi_nickname' => null,
                'region' => 'AP', 'logo' => null, 'thumbnail' => null, 'banner' => null,
                'description' => 'Top up Valorant Points (VP) untuk skin dan battle pass.',
                'status' => true, 'created_at' => $now, 'updated_at' => $now,
            ],
        ];

        DB::table('categories')->insert($categories);
    }
}
