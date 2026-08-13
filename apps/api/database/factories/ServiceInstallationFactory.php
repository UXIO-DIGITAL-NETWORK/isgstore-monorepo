<?php

namespace Database\Factories;

use App\Models\Service;
use App\Models\ServiceInstallation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ServiceInstallation>
 */
class ServiceInstallationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'service_id' => Service::factory(),
            'starts_at' => null,
            'ends_at' => null,
            'notes' => null,
        ];
    }

    public function scheduled(): static
    {
        return $this->state(fn () => [
            'starts_at' => now(),
            'ends_at' => now()->addDays(5),
        ]);
    }
}
