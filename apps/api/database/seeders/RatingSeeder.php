<?php

namespace Database\Seeders;

use App\Models\Order;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RatingSeeder extends Seeder
{
    public function run(): void
    {
        $successOrders = Order::where('status', 'Success')->get();
        $items = [];

        foreach ($successOrders as $order) {
            // ~70% of successful orders get rated
            if (rand(1, 100) > 70) {
                continue;
            }

            $items[] = [
                'order_id' => $order->id,
                'user_id' => $order->user_id,
                'rating' => fake()->numberBetween(3, 5), // Realistic bias towards good ratings
                'created_at' => $order->created_at->addHours(rand(1, 48)),
                'updated_at' => $order->created_at->addHours(rand(1, 48)),
            ];
        }

        if (! empty($items)) {
            DB::table('ratings')->insert($items);
        }
    }
}
