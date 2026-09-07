<?php

namespace Database\Factories;

use App\Models\ServiceInstallation;
use App\Models\ServiceInstallationStep;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ServiceInstallationStep>
 */
class ServiceInstallationStepFactory extends Factory
{
    public function definition(): array
    {
        return [
            'service_installation_id' => ServiceInstallation::factory(),
            'title' => fake()->sentence(3),
            'description' => null,
            'sort_order' => 0,
            'completed_at' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn () => ['completed_at' => now()]);
    }
}
