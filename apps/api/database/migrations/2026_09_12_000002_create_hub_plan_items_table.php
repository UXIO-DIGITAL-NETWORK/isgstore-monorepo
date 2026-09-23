<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The Hub's service plan for this site, cached locally.
 *
 * Three reasons to persist what could simply be read and thrown away:
 *
 *  1. The payment page can show "what you must renew, and when" without a live
 *     call to the Hub on every page load.
 *  2. It is a debuggable record of what the Hub actually said, which matters
 *     when the question is "why was this client billed".
 *  3. Billing keeps working through a Hub outage. "An unreachable Hub changes
 *     nothing" is the design rule; without this table it would quietly mean
 *     "nobody gets billed while the Hub is down".
 *
 * Upserted by `item_key`, never deleted — sync never deletes, and this table's
 * keys are referenced by issued invoices.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hub_plan_items', function (Blueprint $table) {
            $table->id();
            // Identical to service_invoices.hub_item_key.
            $table->string('item_key', 191)->unique();
            $table->string('plan_uid', 64)->index();
            $table->unsignedInteger('period_index');
            $table->string('service_code');
            $table->string('service_name');
            // The per-site negotiated price. NOT services.selling_price — billing
            // from the catalog would charge every negotiated client list price.
            $table->unsignedBigInteger('amount');
            $table->unsignedInteger('duration_days');
            $table->string('billing_mode', 20); // billed | prepaid
            $table->timestamp('period_starts_at');
            $table->timestamp('period_ends_at');
            $table->timestamp('due_at')->nullable();
            // Only this one renews the site's own licence with the Hub.
            $table->boolean('governs_licence')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamp('synced_at');
            $table->timestamps();

            $table->index(['service_code', 'period_index']);
            $table->index('due_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hub_plan_items');
    }
};
