<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'role_id' => fake()->numberBetween(1, 5), // Acak Role dari 1 sampai 5
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),

            // Kolom kustom
            'username' => fake()->unique()->userName(),
            'avatar' => null,
            'phone' => '628'.fake()->numerify('##########'),
            'balance' => fake()->randomFloat(2, 0, 5000000), // Saldo acak 0 - 5 juta
            'point' => fake()->numberBetween(0, 1000),
            'status' => 'active',
            'locale' => 'id',
            'timezone' => 'Asia/Jakarta',
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
