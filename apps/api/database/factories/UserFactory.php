<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;
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
            // Same reasoning as `email_verified_at` above, which Laravel's own
            // scaffold defaults for exactly this purpose: the factory makes a
            // *usable* account, and an admin without a second factor is refused
            // by `EnsureTwoFactorSatisfied` on every admin route. The 2FA tests
            // override this to null when an un-enrolled user is the point.
            'two_factor_confirmed_at' => now(),
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

    /**
     * An account the panel lets in without a second factor at all.
     *
     * Distinct from `withoutTwoFactor()`: that one simply has not enrolled yet
     * and is refused by `EnsureTwoFactorSatisfied`; this one is exempt from ever
     * being asked. See App\Support\Auth\TwoFactorPolicy.
     */
    public function twoFactorExempt(): static
    {
        return $this->state(fn () => [
            'two_factor_confirmed_at' => null,
            'two_factor_exempt' => true,
        ]);
    }

    /** An account that has never set up a second factor. */
    public function withoutTwoFactor(): static
    {
        return $this->state(fn () => [
            'two_factor_secret' => null,
            'two_factor_pending_secret' => null,
            'two_factor_pending_created_at' => null,
            'two_factor_confirmed_at' => null,
            'two_factor_last_used_timestep' => null,
        ]);
    }

    /**
     * An enrolled account midway through moving its authenticator.
     *
     * Both secrets are live at once by design: the old one still authenticates
     * until a code from the new one is accepted.
     */
    public function withPendingTwoFactorRotation(string $pendingSecret, ?Carbon $startedAt = null): static
    {
        return $this->state(fn () => [
            'two_factor_confirmed_at' => now(),
            'two_factor_pending_secret' => $pendingSecret,
            'two_factor_pending_created_at' => $startedAt ?? now(),
        ]);
    }
}
