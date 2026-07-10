<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PricingRuleSeeder extends Seeder
{
    /**
     * Global (category_id = NULL) markup rules per role, matching the tiers
     * used by ProductSeeder: member +20%, vip +15%, reseller +10%, agent +5%.
     * Per-category overrides can be added via the pricing-rules admin API.
     */
    public function run(): void
    {
        $now = now();

        DB::table('pricing_rules')->insert([
            ['category_id' => null, 'role' => 'member', 'markup_percent' => 20.00, 'markup_flat' => 0, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => null, 'role' => 'vip', 'markup_percent' => 15.00, 'markup_flat' => 0, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => null, 'role' => 'reseller', 'markup_percent' => 10.00, 'markup_flat' => 0, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => null, 'role' => 'agent', 'markup_percent' => 5.00, 'markup_flat' => 0, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }
}
