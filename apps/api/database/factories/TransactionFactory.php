<?php

namespace Database\Factories;

use App\Models\PaymentChannel;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\Transaction;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Transaction>
 */
class TransactionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'invoice_number' => 'INV-'.date('Ymd').'-'.strtoupper(Str::random(6)),
            'transaction_type' => 'prepaid',
            'user_id' => null,
            'payment_channel_id' => PaymentChannel::factory(),
            'guest_contact' => '6281234567890',
            'product_id' => Product::factory(),
            'supplier_id' => Supplier::factory(),
            'target_uid' => '12345678',
            'target_server' => null,
            'amount_base' => 12000,
            'amount_fee' => 0,
            'amount_total' => 12000,
            'margin' => 2000,
            'status' => 'PENDING',
        ];
    }
}
