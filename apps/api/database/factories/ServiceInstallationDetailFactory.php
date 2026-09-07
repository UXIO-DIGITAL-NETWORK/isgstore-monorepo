<?php

namespace Database\Factories;

use App\Models\ServiceInstallation;
use App\Models\ServiceInstallationDetail;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ServiceInstallationDetail>
 */
class ServiceInstallationDetailFactory extends Factory
{
    public function definition(): array
    {
        return [
            'service_installation_id' => ServiceInstallation::factory(),
            'label' => 'Username',
            'value' => 'uxio-prod',
            'is_secret' => false,
            'sort_order' => 0,
        ];
    }

    public function secret(): static
    {
        return $this->state(fn () => [
            'label' => 'API Key',
            'value' => 'sk_live_'.fake()->regexify('[A-Za-z0-9]{24}'),
            'is_secret' => true,
        ]);
    }
}
