<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One milestone in an installation checklist.
 *
 * The completion fact lives here and only here — progress is
 * COUNT(completed) / COUNT(*) computed per request, so there is no stored
 * percentage that can drift from the checklist it claims to summarise.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_installation_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_installation_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('description')->nullable();
            // Explicit display order; ties break on id so the list is deterministic.
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamp('completed_at')->nullable();
            // Nullable + nullOnDelete: removing a staff account must not delete
            // the client's installation history.
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // The only read this table serves: one installation's checklist, in
            // order. Named explicitly — the generated name would be 67 chars and
            // MySQL caps identifiers at 64.
            $table->index(['service_installation_id', 'sort_order'], 'installation_steps_order_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_installation_steps');
    }
};
