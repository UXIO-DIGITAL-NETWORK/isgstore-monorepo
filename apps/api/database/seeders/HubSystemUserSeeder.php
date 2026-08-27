<?php

namespace Database\Seeders;

use App\Support\Hub\HubSystemUser;
use Illuminate\Database\Seeder;

/**
 * The system account that money-path actions driven from the Uxio Hub are
 * attributed to (approved_by/verified_by). Idempotent — resolve() firstOrCreates.
 */
class HubSystemUserSeeder extends Seeder
{
    public function run(): void
    {
        HubSystemUser::resolve();
    }
}
