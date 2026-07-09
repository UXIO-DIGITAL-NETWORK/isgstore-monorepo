<?php

namespace Database\Seeders;

use App\Models\Order;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        $orders = Order::all();
        $paymentMethodCount = DB::table('payment_methods')->count();
        $payments = [];

        foreach ($orders as $order) {
            $methodId = rand(1, $paymentMethodCount);
            $adminFee = fake()->randomElement([0, 1000, 1500, 2500, 3000, 4000]);
            $gross = $order->total_price + $adminFee;
            $isPaid = in_array($order->status, ['Success', 'Processing']);

            // Generate realistic payment_data based on method
            $paymentData = match (true) {
                $methodId <= 4 => json_encode(['virtual_account' => '880'.fake()->numerify('##########'), 'bank' => ['BCA', 'BNI', 'BRI', 'Mandiri'][$methodId - 1]]),
                $methodId <= 8 => json_encode(['deep_link' => 'https://payment.uxio.id/redirect/'.Str::random(12), 'ewallet' => ['OVO', 'GoPay', 'DANA', 'ShopeePay'][$methodId - 5]]),
                $methodId == 9 => json_encode(['qr_string' => '00020101021226660014ID.CO.MONETAPAY'.Str::random(20)]),
                $methodId <= 11 => json_encode(['payment_code' => strtoupper(Str::random(12)), 'store' => $methodId == 10 ? 'Alfamart' : 'Indomaret']),
                default => json_encode(['method' => 'system_balance', 'deducted_from' => 'user_balance']),
            };

            $payments[] = [
                'order_id' => $order->id,
                'payment_method_id' => $methodId,
                'reference_id' => 'PAY-'.$order->invoice_number.'-01',
                'pg_transaction_id' => $isPaid ? 'MNTP-'.strtoupper(Str::random(12)) : null,
                'gross_amount' => $gross,
                'admin_fee' => $adminFee,
                'payment_data' => $paymentData,
                'status' => $isPaid ? 'success' : ($order->status === 'Failed' ? 'failed' : 'pending'),
                'paid_at' => $isPaid ? $order->created_at->addMinutes(rand(1, 30)) : null,
                'created_at' => $order->created_at,
                'updated_at' => $order->created_at,
            ];
        }

        DB::table('payments')->insert($payments);
    }
}
