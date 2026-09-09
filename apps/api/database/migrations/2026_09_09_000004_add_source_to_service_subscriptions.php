<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Where a subscription row came from.
 *
 * `local` is every row this site created for itself: a merchant bought a
 * service, the invoice was paid, `ActivateServiceSubscriptionAction` stacked a
 * new row. Those keep stacking — one row per purchase, which is how the billing
 * history stays readable.
 *
 * `hub` is different: it is this site's OWN licence, mirrored down from the Hub,
 * and there is exactly one of it, updated in place. The Hub already holds the
 * stacked truth; stacking it again here would double-count against the
 * `max(ends_at)` every reader uses.
 *
 * Storing the term as an ordinary subscription row rather than in a table of its
 * own is what makes the admin sidebar card and the client's "Langganan Saya" tab
 * show it with no new read path — `service_invoice_id` was already nullable for
 * exactly this kind of arrangement.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_subscriptions', function (Blueprint $table) {
            $table->string('source', 20)->default('local')->after('service_invoice_id');
            // The lookup the licence sync does on every run.
            $table->index(['merchant_id', 'service_id', 'source']);
        });
    }

    public function down(): void
    {
        Schema::table('service_subscriptions', function (Blueprint $table) {
            $table->dropIndex(['merchant_id', 'service_id', 'source']);
            $table->dropColumn('source');
        });
    }
};
