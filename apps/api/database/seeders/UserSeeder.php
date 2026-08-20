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
        // Every account starts with balance 0 — no seeded "free" saldo. For a
        // payment-page merchant the withdrawable balance is derived from actual
        // sales (see App\Support\Wallet\MerchantBalance), not this column.
        $users = [
            // role, name, username, email, phone, balance
            [RoleType::ADMIN, 'Super Admin', 'superadmin', 'admin@example.com', '6281200000001', 0],
            [RoleType::MEMBER, 'Member Satu', 'member1', 'member1@example.com', '6281200000002', 0],
            [RoleType::MEMBER, 'Member Dua', 'member2', 'member2@example.com', '6281200000003', 0],
            [RoleType::VIP, 'VIP User', 'vipuser', 'vip@example.com', '6281200000004', 0],
            [RoleType::RESELLER, 'Reseller User', 'reseller', 'reseller@example.com', '6281200000005', 0],
            [RoleType::AGENT, 'Agent User', 'agentuser', 'agent@example.com', '6281200000006', 0],
            // Payment page: client (requests withdrawals) and internal team (verifies).
            [RoleType::PAYMENT_ADMIN, 'Client Merchant', 'client', 'client@example.com', '6281200000007', 0],
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
                    'balance' => $balance,
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
