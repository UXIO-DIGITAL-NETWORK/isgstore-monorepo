<?php

namespace Database\Factories;

use App\Enums\ServiceInvoiceStatus;
use App\Models\Service;
use App\Models\ServiceInvoice;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ServiceInvoice>
 */
class ServiceInvoiceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'invoice_number' => 'SINV-'.date('Ym').'-'.strtoupper(Str::random(6)),
            'service_id' => Service::factory(),
            'service_name' => fake()->words(2, true),
            'amount' => 250000,
            'duration_days' => 30,
            'status' => ServiceInvoiceStatus::UNPAID->value,
            'due_at' => now()->addDays(3),
        ];
    }

    public function waitingConfirmation(): static
    {
        return $this->state(fn () => [
            'status' => ServiceInvoiceStatus::WAITING_CONFIRMATION->value,
        ]);
    }
}
