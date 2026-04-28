<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Product;
use Illuminate\Support\Str;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $users = User::pluck('id')->toArray();
        $products = Product::all();
        $statuses = ['Pending','Processing','Success','Success','Success','Failed'];
        $orders = [];

        for ($i = 0; $i < 40; $i++) {
            $product = $products->random();
            $userId = $users[array_rand($users)];
            // Determine price based on user role_id: 2=member,3=vip,4=reseller,5=agent, default=member
            $user = User::find($userId);
            $price = match ((int)$user->role_id) {
                3 => $product->price_vip,
                4 => $product->price_reseller,
                5 => $product->price_agent,
                default => $product->price_member,
            };
            $margin = $price - $product->price_modal;
            $status = $statuses[array_rand($statuses)];

            $supplierId = match (true) {
                $product->category_id <= 15 => 1,
                $product->category_id <= 19 => 2,
                default => 3,
            };

            $createdAt = $now->copy()->subDays(rand(0, 30))->subHours(rand(0, 23));

            $orders[] = [
                'invoice_number'  => 'INV-' . $createdAt->format('Ymd') . '-' . strtoupper(Str::random(8)),
                'user_id'         => $userId,
                'product_id'      => $product->id,
                'supplier_id'     => $supplierId,
                'target_uid'      => (string)fake()->numerify('#########'),
                'target_server'   => (string)fake()->numerify('#####'),
                'total_price'     => $price,
                'margin'          => $margin,
                'status'          => $status,
                'is_manual'       => fake()->boolean(10),
                'sn'              => $status === 'Success' ? strtoupper(Str::random(16)) : null,
                'supplier_trx_id' => $status !== 'Pending' ? 'DGF-' . strtoupper(Str::random(10)) : null,
                'supplier_status' => $status === 'Success' ? 'Sukses' : ($status === 'Failed' ? 'Gagal' : null),
                'created_at'      => $createdAt,
                'updated_at'      => $createdAt,
            ];
        }

        DB::table('orders')->insert($orders);
    }
}
