<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * In-app notifications, fanned out one row per recipient (the payment-internal
 * team). Kept separate from Laravel's DatabaseNotification so it matches the
 * codebase's plain-table style (mirrors activity_logs) and carries a
 * `dedupe_key`: transaction alerts leave it null (repeat freely), while
 * "subscription expiring" alerts set it so H-7/H-3 each fire exactly once.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type')->index(); // transaction_sale | service_payment | withdrawal_request | subscription_expiring
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable(); // reference / merchant_id / link ids
            // Set for de-duplicatable alerts (e.g. "subexp:{id}:7"); null for
            // one-off events. MySQL/SQLite allow multiple NULLs under a unique index.
            $table->string('dedupe_key')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'read_at']);
            $table->unique(['user_id', 'dedupe_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
