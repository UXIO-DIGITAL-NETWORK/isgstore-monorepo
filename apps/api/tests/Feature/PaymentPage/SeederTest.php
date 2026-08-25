<?php

namespace Tests\Feature\PaymentPage;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_role_and_user_seeders_match_the_current_scheme(): void
    {
        $this->seed(RoleSeeder::class);
        $this->seed(UserSeeder::class);

        // Seven roles, including the two payment-page roles.
        $this->assertSame(7, Role::count());
        foreach (['admin', 'member', 'vip', 'reseller', 'agent', 'payment-internal', 'payment-admin'] as $name) {
            $this->assertTrue(
                Role::whereRaw('LOWER(name) = ?', [$name])->exists(),
                "Missing role: {$name}",
            );
        }

        // Exactly the three operator logins. The tier roles stay seeded because
        // registration and pricing need them, but nobody is seeded INTO them —
        // member/vip/reseller/agent belong to real customers who sign up.
        $this->assertSame(3, User::count());
        $this->assertSame(0, User::whereHas('role', fn ($q) => $q->whereRaw('LOWER(name) = ?', ['member']))->count());

        foreach (['admin', 'payment-admin', 'payment-internal'] as $role) {
            $this->assertSame(
                1,
                User::whereHas('role', fn ($q) => $q->whereRaw('LOWER(name) = ?', [$role]))->count(),
                "Expected exactly one {$role} user",
            );
        }
    }
}
