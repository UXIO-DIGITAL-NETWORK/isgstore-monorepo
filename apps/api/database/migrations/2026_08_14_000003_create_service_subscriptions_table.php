<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * An active period of one service for one client.
 *
 * A row exists only once its invoice is confirmed PAID, so there is no
 * "pending subscription with empty dates" state — a client awaiting
 * verification sees an UNPAID invoice in its purchase history instead, and
 * this table stays a list of things that are genuinely active.
 *
 * Renewals stack: a second row starts at the current row's `ends_at` rather
 * than extending it, which keeps one row per purchase and therefore a real
 * period history.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            // Nullable so kita can grant a subscription with no invoice behind
            // it (a comp, or a migration of an existing arrangement).
            $table->foreignId('service_invoice_id')->nullable()->constrained()->nullOnDelete();
            // NOT NULL: a row only exists once the period is real.
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->string('status')->default('ACTIVE')->index(); // App\Enums\SubscriptionStatus
            $table->timestamps();

            // The client's "nearest expiry" lookup and the nightly sweep.
            $table->index(['merchant_id', 'status', 'ends_at']);
            // Kita's "who subscribes to what".
            $table->index(['service_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_subscriptions');
    }
};
