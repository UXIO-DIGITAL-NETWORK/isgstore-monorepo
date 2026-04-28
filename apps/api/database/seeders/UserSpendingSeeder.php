<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Order;

class UserSpendingSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $period = $now->format('Y-m');

        // Aggregate spending per user from orders
        $userOrders = Order::where('status', 'Success')
            ->selectRaw('user_id, SUM(total_price) as total_amount, COUNT(*) as total_orders, MAX(created_at) as last_order_at')
            ->groupBy('user_id')
            ->get();

        $items = [];
        foreach ($userOrders as $row) {
            $items[] = [
                'user_id'       => $row->user_id,
                'period'        => $period,
                'total_amount'  => (int) $row->total_amount,
                'total_orders'  => $row->total_orders,
                'last_order_at' => $row->last_order_at,
                'created_at'    => $now,
                'updated_at'    => $now,
            ];
        }

        if (!empty($items)) {
            DB::table('user_spendings')->insert($items);
        }
    }
}
