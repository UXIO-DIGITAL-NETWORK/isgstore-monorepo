<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Paid membership tiers.
 *
 * `role_id` is the load-bearing column: the platform already prices by role
 * (`RolePrice` resolves vip → reseller → agent → member), so a plan that did
 * not grant a role would grant nothing.
 *
 * `name` and `benefits` are locale-keyed JSON rather than one row per
 * language, because a plan is a purchasable entity with a price and a role —
 * splitting it per language would mean two rows competing to be the same
 * product.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_plans', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->json('name');
            $table->json('benefits')->nullable();
            $table->unsignedBigInteger('price');
            $table->unsignedInteger('duration_days');
            $table->foreignId('role_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('is_popular')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('membership_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('membership_plan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('transaction_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->enum('status', ['active', 'expired', 'cancelled'])->default('active');
            $table->timestamps();

            $table->index(['user_id', 'status', 'ends_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('membership_expires_at')->nullable()->after('point');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('membership_expires_at');
        });
        Schema::dropIfExists('membership_subscriptions');
        Schema::dropIfExists('membership_plans');
    }
};
