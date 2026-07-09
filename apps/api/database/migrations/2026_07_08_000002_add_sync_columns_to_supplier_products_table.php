<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supplier_products', function (Blueprint $table) {
            // Postpaid (pasca) price-list fields from Digiflazz.
            $table->bigInteger('admin_fee')->nullable()->after('price');
            $table->bigInteger('commission')->nullable()->after('admin_fee');
            // Set when the daily sync deactivates a mapping because Digiflazz
            // reported it unavailable; only stamped rows are auto-reactivated,
            // so a manual admin deactivation is never overridden.
            $table->timestamp('sync_deactivated_at')->nullable()->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('supplier_products', function (Blueprint $table) {
            $table->dropColumn(['admin_fee', 'commission', 'sync_deactivated_at']);
        });
    }
};
