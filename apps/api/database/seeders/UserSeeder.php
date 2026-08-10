<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Buat 1 Super Admin statis agar mudah login saat testing
        User::create([
            'role_id' => 1,
            'name' => 'Super Admin',
            'username' => 'superadmin',
            'avatar' => null,
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'phone' => '6281234567890',
            'balance' => 9999999,
            'point' => 9999,
            'status' => 'active',
            'locale' => 'id',
            'timezone' => 'Asia/Jakarta',
            'email_verified_at' => now(),
        ]);

        // 2. Generate 19 User tambahan secara acak dengan berbagai role
        User::factory()->count(190)->create();
    }
}
