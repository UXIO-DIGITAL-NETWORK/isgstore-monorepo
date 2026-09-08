<?php

namespace Database\Seeders;

use App\Enums\RoleType;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * The three operator logins, and nothing else.
 *
 * Not one account per role: the tier roles (member/vip/reseller/agent) belong to
 * real customers who sign up, and seeding stand-ins for them left example
 * accounts on a live install. What remains is the staff side — the admin who
 * runs the catalogue, plus the two halves of the payment page: `internal`
 * (kita — verifies withdrawals, sets fees) and `client` (the merchant).
 *
 * The `client` row is load-bearing beyond its own login: `DefaultMerchant::id()`
 * falls back to the first payment-admin user, and `CheckoutAction` reads it to
 * attribute a sale. Without it every sale is booked as platform-owned and
 * settlement returns early.
 *
 * RoleSeeder still seeds all seven roles — `member` in particular, or public
 * registration throws (RegisterAction).
 */
class UserSeeder extends Seeder
{
    /** Shared starting password. Change it from the profile page after first login. */
    private const PASSWORD = 'uxiolabsJaya123';

    public function run(): void
    {
        // Every account starts with balance 0 — no seeded "free" saldo. For a
        // payment-page merchant the withdrawable balance is derived from actual
        // sales (see App\Support\Wallet\MerchantBalance), not this column.
        $users = [
            // role, name, username, email, phone, balance
            [RoleType::ADMIN, 'Super Admin', 'superadmin', 'admin@isgstore.id', '6281200000001', 0],
            // Payment page: internal team (verifies) and merchant (requests withdrawals).
            [RoleType::PAYMENT_INTERNAL, 'Internal Finance', 'internal', 'internal@isgstore.id', '6281200000002', 0],
            [RoleType::PAYMENT_ADMIN, 'ISG Store', 'isgstore', 'payment@isgstore.id', '6281200000003', 0],
        ];

        foreach ($users as [$role, $name, $username, $email, $phone, $balance]) {
            User::updateOrCreate(
                ['email' => $email],
                [
                    'role_id' => $this->roleId($role),
                    'name' => $name,
                    'username' => $username,
                    'avatar' => null,
                    'password' => Hash::make(self::PASSWORD),
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
