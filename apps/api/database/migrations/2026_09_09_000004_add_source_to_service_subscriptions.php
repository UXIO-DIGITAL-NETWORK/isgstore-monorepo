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
 * `hub` is different: the row is mirrored from the Hub and updated IN PLACE
 * rather than stacked, because the Hub already holds the stacked truth and
 * stacking it again here would double-count against the `max(ends_at)` every
 * reader uses.
 *
 * There is exactly one such row PER SERVICE, not one in total — the index below
 * is deliberately not unique. `ApplyHubLicenceAction` owns the one for the
 * website service (this site's own licence); `ApplyHubPlanAction` writes one per
 * prepaid service in the Hub's plan, and writes none for the website service so
 * the two can never both claim that row.
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
