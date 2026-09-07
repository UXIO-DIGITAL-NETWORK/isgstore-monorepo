<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the fields the Product bulk-management feature needs:
 * - suppliers.is_system      → protected providers (no delete, not selectable)
 * - products price controls  → lock (skip sync), hide (Show Price), min/max limits
 * - supplier_products        → lock + per-tier profit-margin overrides
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->boolean('is_system')->default(false)->after('status');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_price_locked')->default(false)->after('is_available');
            $table->boolean('is_price_hidden')->default(false)->after('is_price_locked');
            // 0/null = no limit. Clamped by PricingService when set.
            $table->bigInteger('price_min')->nullable()->after('is_price_hidden');
            $table->bigInteger('price_max')->nullable()->after('price_min');
        });

        Schema::table('supplier_products', function (Blueprint $table) {
            $table->boolean('is_price_locked')->default(false)->after('is_active');
            // Per-tier markup override (percent). Null = fall back to pricing_rules.
            $table->decimal('margin_member', 6, 2)->nullable()->after('is_price_locked');
            $table->decimal('margin_vip', 6, 2)->nullable()->after('margin_member');
            $table->decimal('margin_reseller', 6, 2)->nullable()->after('margin_vip');
            $table->decimal('margin_agent', 6, 2)->nullable()->after('margin_reseller');
        });
    }

    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn('is_system');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['is_price_locked', 'is_price_hidden', 'price_min', 'price_max']);
        });

        Schema::table('supplier_products', function (Blueprint $table) {
            $table->dropColumn([
                'is_price_locked',
                'margin_member',
                'margin_vip',
                'margin_reseller',
                'margin_agent',
            ]);
        });
    }
};
