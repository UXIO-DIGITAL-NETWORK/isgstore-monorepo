<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Discount codes.
 *
 * `is_public` separates codes the storefront may advertise from codes a
 * customer has to already know. A private code that appeared in the public
 * list would be no code at all.
 *
 * `promo_redemptions` is what makes `quota_total` and `quota_per_user`
 * enforceable, and gives finance an audit trail of what each discount cost.
 * `used_count` on the parent is a denormalised counter for the admin list, not
 * the source of truth for quota checks.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promos', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('type', ['percentage', 'fixed'])->default('percentage');
            $table->unsignedBigInteger('value');
            $table->unsignedBigInteger('max_discount')->nullable();
            $table->unsignedBigInteger('min_purchase')->default(0);
            $table->enum('scope', ['global', 'category', 'product'])->default('global');
            $table->unsignedBigInteger('scope_id')->nullable();
            $table->unsignedInteger('quota_total')->nullable();
            $table->unsignedInteger('quota_per_user')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('is_public')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'starts_at', 'ends_at']);
        });

        Schema::create('promo_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('promo_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('transaction_id')->nullable()->constrained()->nullOnDelete();
            $table->string('code_used');
            $table->unsignedBigInteger('discount_amount');
            $table->timestamps();

            $table->index(['promo_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promo_redemptions');
        Schema::dropIfExists('promos');
    }
};
