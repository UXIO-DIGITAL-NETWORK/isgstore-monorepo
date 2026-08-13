<?php

namespace Database\Factories;

use App\Enums\IncidentSeverity;
use App\Enums\IncidentStatus;
use App\Models\ServiceIncident;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ServiceIncident>
 */
class ServiceIncidentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'severity' => IncidentSeverity::MINOR->value,
            'status' => IncidentStatus::INVESTIGATING->value,
            'message' => fake()->sentence(),
            'started_at' => now(),
        ];
    }

    public function resolved(): static
    {
        return $this->state(fn () => [
            'status' => IncidentStatus::RESOLVED->value,
            'resolved_at' => now(),
        ]);
    }
}
