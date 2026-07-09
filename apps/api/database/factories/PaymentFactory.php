<?php

namespace Database\Factories;

use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\Transaction;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'transaction_id' => Transaction::factory(),
            'payment_channel_id' => PaymentChannel::factory(),
            'reference_id' => 'PAY-'.strtoupper(Str::random(10)).'-01',
            'pg_transaction_id' => null,
            'gross_amount' => 12000,
            'admin_fee' => 0,
            'payment_data' => null,
            'status' => '1',
            'paid_at' => null,
        ];
    }
}
