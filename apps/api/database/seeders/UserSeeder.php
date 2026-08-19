<?php

namespace Database\Seeders;

use App\Enums\RoleType;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * One example user per role, plus a second general (member) user. No random
 * bulk users — every account here is a known, purposeful login. All share the
 * password `password`.
 */
class UserSeeder extends Seeder
{
    public function run(): void
    {
        // NOTE: the balance column below is the intended per-user starting saldo,
        // but every account is seeded with balance 0 for now (see the insert).
        $users = [
            // role, name, username, email, phone, balance
            [RoleType::ADMIN, 'Super Admin', 'superadmin', 'admin@example.com', '6281200000001', 9999999],
            [RoleType::MEMBER, 'Member Satu', 'member1', 'member1@example.com', '6281200000002', 100000],
            [RoleType::MEMBER, 'Member Dua', 'member2', 'member2@example.com', '6281200000003', 100000],
            [RoleType::VIP, 'VIP User', 'vipuser', 'vip@example.com', '6281200000004', 250000],
            [RoleType::RESELLER, 'Reseller User', 'reseller', 'reseller@example.com', '6281200000005', 250000],
            [RoleType::AGENT, 'Agent User', 'agentuser', 'agent@example.com', '6281200000006', 250000],
            // Payment page: client (requests withdrawals) and internal team (verifies).
            [RoleType::PAYMENT_ADMIN, 'Client Merchant', 'client', 'client@example.com', '6281200000007', 500000],
            [RoleType::PAYMENT_INTERNAL, 'Internal Finance', 'internal', 'internal@example.com', '6281200000008', 0],
        ];

        foreach ($users as [$role, $name, $username, $email, $phone, $balance]) {
            User::updateOrCreate(
                ['email' => $email],
                [
                    'role_id' => $this->roleId($role),
                    'name' => $name,
                    'username' => $username,
                    'avatar' => null,
                    'password' => Hash::make('password'),
                    'phone' => $phone,
                    // Temporarily 0 for every user; swap back to `$balance` to
                    // restore the intended saldo listed in $users above.
                    'balance' => 0,
                    'point' => 0,
                    'status' => 'active',
                    'locale' => 'id',
                    'timezone' => 'Asia/Jakarta',
                    'email_verified_at' => now(),
                ]
            );
        }
    }

    /** Resolve a role id by its enum value (case-insensitive name match). */
    private function roleId(RoleType $role): int
    {
        return (int) Role::whereRaw('LOWER(name) = ?', [$role->value])->value('id');
    }
}
