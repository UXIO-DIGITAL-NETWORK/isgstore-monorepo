<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SubCategorySeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // Games only. `currency_name` is the in-game currency the denominations
        // buy (shown on the storefront); `description` is optional.
        $subs = [
            ['id' => 1, 'category_id' => 1, 'name' => 'Diamond', 'currency_name' => 'Diamond', 'description' => null, 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'category_id' => 1, 'name' => 'Membership', 'currency_name' => 'Pass', 'description' => null, 'status' => true, 'created_at' => $now, 'updated_at' => $now],
        ];

        DB::table('sub_categories')->insert($subs);
    }
}
