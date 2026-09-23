<?php

namespace Database\Seeders;

use App\Enums\RoleType;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * The one account that reaches the panel without an authenticator.
 *
 * `two_factor_exempt` is granted here and nowhere else. It exists so the site's
 * developer can get in, and it is a deliberate hole: this account is only as
 * safe as its password, so change it after the first login and treat it as a
 * shared secret (see App\Support\Auth\TwoFactorPolicy).
 *
 * A seeder of its own rather than a fourth row inside `UserSeeder`, so it can be
 * run against a live install — `php artisan db:seed --class=DeveloperUserSeeder`
 * — WITHOUT re-running `UserSeeder`, whose `updateOrCreate` would reset the three
 * operator passwords back to the shipped default.
 */
class DeveloperUserSeeder extends Seeder
{
    /** Same starting password as the operator logins. Change it after first login. */
    private const PASSWORD = 'uxiolabsJaya123';

    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'developer@uxiotopup.id'],
            [
                'role_id' => (int) Role::whereRaw('LOWER(name) = ?', [RoleType::ADMIN->value])->value('id'),
                'name' => 'Developer',
                'username' => 'developer',
                'avatar' => null,
                'password' => Hash::make(self::PASSWORD),
                'phone' => '6281200000004',
                'balance' => 0,
                'point' => 0,
                'status' => 'active',
                'locale' => 'id',
                'timezone' => 'Asia/Jakarta',
                'email_verified_at' => now(),
                // The whole point of this account: no authenticator, ever.
                'two_factor_exempt' => true,
            ]
        );
    }
}
