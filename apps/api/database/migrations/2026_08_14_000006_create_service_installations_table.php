<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kita's installation record for one client's one service: when it is being set
 * up, how far along it is, and the credentials handed over at the end.
 *
 * Grain is the client's *service account*, not one paid period. Renewals stack
 * as NEW `service_subscriptions` rows (ConfirmServiceInvoiceAction starts the
 * second row at the first one's `ends_at`), so keying this on a subscription id
 * would silently orphan a client's API keys the moment they renewed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_installations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            // The period that first paid for this install. Audit only — never
            // used to scope a read, so a renewal deliberately does not repoint it.
            $table->foreignId('service_subscription_id')->nullable()->constrained()->nullOnDelete();
            // The agreed installation window. Both nullable: the row is born the
            // moment the invoice is confirmed, and kita schedules it afterwards.
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            // Internal-authored, client-visible. Free prose, hence text.
            $table->text('notes')->nullable();
            $table->timestamps();

            // The whole invariant: exactly one installation per (client, service).
            // firstOrCreate in two places relies on the database enforcing this,
            // not on both call sites remembering to check.
            $table->unique(['merchant_id', 'service_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_installations');
    }
};
