<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // Games only — this is a game top-up platform. Mobile Legends is the only
        // seeded game for now (real uxiolabs catalogue). `slug` is required for
        // the storefront's slug-based URLs (Catalog::resolveGame);
        // `order_form_fields` is filled by OrderFormSchemaSeeder, which runs after.
        $categories = [
            [
                'id' => 1, 'type_id' => 1, 'name' => 'Mobile Legends', 'sub_name' => 'Bang Bang',
                'code' => 'mlbb', 'slug' => 'mobile-legends', 'validasi_nickname' => null,
                'region' => 'ID', 'logo' => null, 'thumbnail' => null, 'banner' => null,
                'description' => 'Top up Diamond Mobile Legends: Bang Bang, cepat dan aman.',
                'status' => true, 'created_at' => $now, 'updated_at' => $now,
            ],
        ];

        DB::table('categories')->insert($categories);
    }
}
