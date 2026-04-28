<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Pastikan urutannya benar: Role harus ada sebelum User dibuat
        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
        ]);
    }
}
