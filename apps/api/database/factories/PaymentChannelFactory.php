<?php

namespace Database\Factories;

use App\Models\PaymentChannel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PaymentChannel>
 */
class PaymentChannelFactory extends Factory
{
    public function definition(): array
    {
        return [
            'payment_type' => 'virtual_account',
            'channel_code' => fake()->unique()->bothify('ch_????##'),
            'name' => fake()->words(2, true),
            'min_amount' => 0,
            'fee_flat' => 0,
            'fee_percent' => 0,
            'gateway_fee_percent' => 0.70,
            'is_active' => true,
        ];
    }

    public function balance(): static
    {
        return $this->state(fn () => [
            'payment_type' => 'ewallet',
            'channel_code' => 'balance',
            'name' => 'Saldo Internal',
            // Settled from the internal wallet — no external gateway takes a cut.
            'gateway_fee_percent' => 0,
        ]);
    }
}
