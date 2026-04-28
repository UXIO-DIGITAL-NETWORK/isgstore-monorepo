<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Order;

class PointHistorySeeder extends Seeder
{
    public function run(): void
    {
        $successOrders = Order::where('status', 'Success')->get();
        $items = [];

        foreach ($successOrders as $order) {
            $pointsBefore = rand(0, 500);
            $pointsAdded = (int)($order->total_price / 10000); // 1 point per Rp 10.000
            if ($pointsAdded < 1) $pointsAdded = 1;
            $pointsAfter = $pointsBefore + $pointsAdded;

            $items[] = [
                'user_id'       => $order->user_id,
                'order_id'      => $order->id,
                'points_before' => $pointsBefore,
                'points_added'  => $pointsAdded,
                'points_after'  => $pointsAfter,
                'description'   => "Points earned from order {$order->invoice_number}",
                'created_at'    => $order->created_at,
                'updated_at'    => $order->created_at,
            ];
        }

        if (!empty($items)) {
            DB::table('point_histories')->insert($items);
        }
    }
}
