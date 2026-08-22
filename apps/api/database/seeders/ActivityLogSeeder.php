<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ActivityLogSeeder extends Seeder
{
    public function run(): void
    {
        $userIds = User::pluck('id')->toArray();
        $now = now();

        $messages = [
            'Admin logged in from dashboard',
            'Admin created new category: Mobile Legends',
            'Admin updated product price for 86 Diamond MLBB',
            'Admin deleted expired banner: Promo Kemerdekaan',
            'System processed order INV-20260428-ABCD1234',
            'Admin created new user: johndoe@example.com',
            'Admin updated user role to VIP',
            'Admin activated supplier: Uxiotopup',
            'System auto-resolved pending payment MNTP-TRX-001',
            'Admin created new announcement: Server Maintenance',
            'Admin updated Banner: Promo Ramadan 2026',
            'Admin deleted rating ID: 15',
            'Admin exported activity logs to CSV',
            'Admin created product: 125 VP Valorant',
            'System deducted balance for order INV-20260427-XYZ001',
            'Admin bulk-updated product prices for MLBB',
            'Admin created new supplier category mapping',
            'System sent payment callback notification',
            'Admin updated PaymentMethod status: OVO disabled',
            'Admin created new sub-category: Starlight Plus',
            'System refreshed leaderboard cache',
            'Admin uploaded new banner image',
            'Admin toggled announcement active status',
            'System generated monthly spending report',
            'Admin created new server category option: Zone 6',
        ];

        $items = [];
        for ($i = 0; $i < 50; $i++) {
            $items[] = [
                'user_id' => $userIds[array_rand($userIds)],
                'ip_address' => fake()->ipv4(),
                'user_agent' => fake()->userAgent(),
                'message' => $messages[array_rand($messages)],
                'created_at' => $now->copy()->subDays(rand(0, 30))->subMinutes(rand(0, 1440)),
                'updated_at' => $now,
            ];
        }

        DB::table('activity_logs')->insert($items);
    }
}
