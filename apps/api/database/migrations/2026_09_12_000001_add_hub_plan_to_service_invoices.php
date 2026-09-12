<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bills this site issues on the Hub's instruction, rather than because a client
 * clicked "Langganan".
 *
 * `hub_item_key` is the whole duplicate-billing guarantee. It names one period
 * of one plan line — "<plan ulid>:<period index>" — and the unique index below
 * is what makes a sync that runs every fifteen minutes, forever, issue exactly
 * one invoice for it. Not a status check, not a date comparison: an index.
 *
 * NULL for every invoice a client raised themselves, and MySQL and SQLite both
 * treat NULLs as distinct in a unique index — so nothing that already exists is
 * touched, and the local "Langganan" flow is completely unaffected.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_invoices', function (Blueprint $table) {
            $table->string('hub_item_key', 191)->nullable()->after('service_id');
            $table->string('hub_plan_uid', 64)->nullable()->after('hub_item_key');
            // The window this bill buys, as the Hub computed it. Stored so the
            // client's "Langganan Saya" can show a period before it is paid for,
            // and so the subscription opened later lands on the agreed dates
            // rather than on payment day.
            $table->timestamp('period_starts_at')->nullable()->after('duration_days');
            $table->timestamp('period_ends_at')->nullable()->after('period_starts_at');
            // Money that never passed through this site's gateway: the client
            // settled it with kita directly, and an operator recorded it. The
            // column exists so a report can separate the two — see
            // ApplyHubPlanAction for why it must never reach PlatformLedger.
            $table->boolean('settled_offline')->default(false)->after('verified_at');
            $table->string('source', 20)->default('local')->after('settled_offline'); // local | hub_plan

            $table->unique('hub_item_key');
            $table->index('hub_plan_uid');
            // The payment page's "what do I owe" query, and the sync's own
            // "is there already an open bill for this service" check.
            $table->index(['merchant_id', 'source', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('service_invoices', function (Blueprint $table) {
            $table->dropUnique(['hub_item_key']);
            $table->dropIndex(['hub_plan_uid']);
            $table->dropIndex(['merchant_id', 'source', 'status']);
            $table->dropColumn([
                'hub_item_key', 'hub_plan_uid', 'period_starts_at',
                'period_ends_at', 'settled_offline', 'source',
            ]);
        });
    }
};
