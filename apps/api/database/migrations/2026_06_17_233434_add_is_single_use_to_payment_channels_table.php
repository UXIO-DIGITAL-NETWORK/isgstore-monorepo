<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_channels', function (Blueprint $table) {
            $table->boolean('is_single_use')->default(true)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('payment_channels', function (Blueprint $table) {
            $table->dropColumn('is_single_use');
        });
    }
};
