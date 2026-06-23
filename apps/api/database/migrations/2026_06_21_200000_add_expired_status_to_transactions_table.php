<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE transactions MODIFY COLUMN status
                ENUM('PENDING','PAID','PROCESSING','COMPLETED','FAILED_PROVIDER','REFUNDED','EXPIRED')
                NOT NULL DEFAULT 'PENDING'");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE transactions MODIFY COLUMN status
                ENUM('PENDING','PAID','PROCESSING','COMPLETED','FAILED_PROVIDER','REFUNDED')
                NOT NULL DEFAULT 'PENDING'");
        }
    }
};
