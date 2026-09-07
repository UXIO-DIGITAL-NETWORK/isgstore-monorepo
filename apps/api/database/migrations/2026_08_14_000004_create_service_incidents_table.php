<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A disruption kita announces to its clients — a payment method that is playing
 * up, or a service that is closed for maintenance.
 *
 * Written by hand rather than derived from a health check, so scheduled
 * maintenance can be announced before it happens. The client status page merges
 * these with a baseline taken from `payment_channels.is_active`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_incidents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            // Hand-rolled polymorphism: exactly one of the two is set, enforced
            // in StoreIncidentRequest. A morphTo would buy nothing — there are
            // only ever two target types — and would give up the referential
            // integrity these two nullable FKs keep.
            $table->foreignId('service_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('payment_channel_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('severity')->default('MINOR')->index();       // App\Enums\IncidentSeverity
            $table->string('status')->default('INVESTIGATING')->index(); // App\Enums\IncidentStatus
            $table->text('message');
            $table->timestamp('started_at');
            $table->timestamp('estimated_resolved_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // The client status page: open incidents, newest first.
            $table->index(['status', 'started_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_incidents');
    }
};
