<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * One Monetapay attempt may now settle SEVERAL service bills.
 *
 * A client with four things falling due on the same day used to need four QR
 * codes and four payments. The invoices stay one-per-service — that is what
 * keeps each period's own term honest — and the PAYMENT becomes the thing that
 * spans them.
 *
 * `service_invoice_id` becomes nullable and is populated only for a
 * single-invoice attempt, as a convenience for reading history. The pivot is the
 * authority. The alternative — keeping it NOT NULL and letting one invoice be
 * the "anchor" — is a schema that lies: `amount`/`admin_fee`/`total` on the
 * attempt would be the BATCH's while `service_invoice_id` named one bill, and
 * the first query someone writes against it (as UnifiedTransactionQuery already
 * did) reports the whole batch total against a single invoice in a screen the
 * client reads.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_invoice_payments', function (Blueprint $table) {
            // How many bills this attempt covers. Denormalised so a list can say
            // "dibayar bersama 2 tagihan lain" without joining the pivot.
            $table->unsignedInteger('invoice_count')->default(1)->after('service_invoice_id');
        });

        // SQLite cannot drop a foreign key; its `change()` rebuilds the table and
        // the following `foreign()` re-declares the constraint, so the end state
        // matches. Same dance as
        // 2026_08_24_000001_add_pool_support_to_supplier_products.php.
        $isSqlite = Schema::getConnection()->getDriverName() === 'sqlite';

        if (! $isSqlite) {
            Schema::table('service_invoice_payments', function (Blueprint $table) {
                $table->dropForeign(['service_invoice_id']);
            });
        }

        Schema::table('service_invoice_payments', function (Blueprint $table) use ($isSqlite) {
            $table->foreignId('service_invoice_id')->nullable()->change();

            if (! $isSqlite) {
                $table->foreign('service_invoice_id')->references('id')->on('service_invoices')->cascadeOnDelete();
            }
        });
    }

    public function down(): void
    {
        // Only reversible while no batch exists — a batch attempt has no single
        // invoice to put back, and inventing one would misattribute money.
        DB::table('service_invoice_payments')->whereNull('service_invoice_id')->delete();

        $isSqlite = Schema::getConnection()->getDriverName() === 'sqlite';

        if (! $isSqlite) {
            Schema::table('service_invoice_payments', function (Blueprint $table) {
                $table->dropForeign(['service_invoice_id']);
            });
        }

        Schema::table('service_invoice_payments', function (Blueprint $table) use ($isSqlite) {
            $table->foreignId('service_invoice_id')->nullable(false)->change();

            if (! $isSqlite) {
                $table->foreign('service_invoice_id')->references('id')->on('service_invoices')->cascadeOnDelete();
            }
        });

        Schema::table('service_invoice_payments', function (Blueprint $table) {
            $table->dropColumn('invoice_count');
        });
    }
};
