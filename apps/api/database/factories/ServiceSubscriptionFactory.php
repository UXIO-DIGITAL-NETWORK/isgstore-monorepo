<?php

namespace Database\Factories;

use App\Enums\SubscriptionStatus;
use App\Models\Service;
use App\Models\ServiceSubscription;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ServiceSubscription>
 */
class ServiceSubscriptionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'service_id' => Service::factory(),
            'starts_at' => now(),
            'ends_at' => now()->addDays(30),
            'status' => SubscriptionStatus::ACTIVE->value,
        ];
    }

    public function expiredWindow(): static
    {
        return $this->state(fn () => [
            'starts_at' => now()->subDays(40),
            'ends_at' => now()->subDay(),
        ]);
    }
}
