<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE payment_channels MODIFY COLUMN payment_type
                ENUM('virtual_account','qris','ewallet','convenience_store','payment_link') NOT NULL");
        } else {
            // SQLite (local/testing): the original enum became a CHECK constraint
            // that would reject 'payment_link' — rebuild the column as a plain string.
            Schema::table('payment_channels', function (Blueprint $table) {
                $table->string('payment_type')->change();
            });
        }

        Schema::table('payment_channels', function (Blueprint $table) {
            $table->json('extra_config')->nullable()->after('is_single_use');
        });
    }

    public function down(): void
    {
        Schema::table('payment_channels', function (Blueprint $table) {
            $table->dropColumn('extra_config');
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE payment_channels MODIFY COLUMN payment_type
                ENUM('virtual_account','qris','ewallet','convenience_store') NOT NULL");
        }
    }
};
