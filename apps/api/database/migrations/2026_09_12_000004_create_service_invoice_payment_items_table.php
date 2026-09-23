<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Which bills one payment attempt covers, and for how much each.
 *
 * `admin_fee` here is a SHARE, apportioned once when the attempt opens and
 * stored — never recomputed at read time. Two reasons, both of them the kind
 * that surface as a reconciliation ticket months later:
 *
 *  - The channel fee is charged ONCE on the batch total (`fee_flat` plus a
 *    percentage of the sum). Charging `fee_flat` per invoice would be a plain
 *    overcharge, so the shares cannot be derived per invoice.
 *  - Integer division leaves a remainder. It is pushed onto the first row so
 *    SUM(admin_fee) over the pivot equals the attempt's `admin_fee` exactly —
 *    a rupiah that exists in one table and not the other is a bug nobody finds
 *    until somebody balances the books.
 *
 * Backfilled one-to-one from every existing attempt, so readers can go through
 * the pivot unconditionally instead of branching on "is this a batch".
 */
return new class extends Migration
{
    public function up(): void
    {
        // Every index and constraint here is named EXPLICITLY. Laravel's generated
        // names are built from the table plus every column, and this table's name
        // is long enough that the composite unique came out at 82 characters —
        // past MySQL's 64-character identifier limit, so the migration failed on
        // a server while passing on SQLite, which has no such limit. The
        // payment-id foreign key landed at exactly 64: legal, but one rename away
        // from the same failure. Short names cost nothing and remove the cliff.
        Schema::create('service_invoice_payment_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_invoice_payment_id');
            $table->foreignId('service_invoice_id');
            // This bill's own amount — exact, never apportioned.
            $table->unsignedBigInteger('amount');
            // This bill's share of the one channel fee. Sums to the attempt's.
            $table->unsignedBigInteger('admin_fee')->default(0);
            $table->timestamps();

            $table->foreign('service_invoice_payment_id', 'sipi_payment_foreign')
                ->references('id')->on('service_invoice_payments')->cascadeOnDelete();
            $table->foreign('service_invoice_id', 'sipi_invoice_foreign')
                ->references('id')->on('service_invoices')->cascadeOnDelete();

            $table->unique(['service_invoice_payment_id', 'service_invoice_id'], 'sipi_payment_invoice_unique');
            $table->index('service_invoice_id', 'sipi_invoice_index');
        });

        DB::table('service_invoice_payments')
            ->whereNotNull('service_invoice_id')
            ->orderBy('id')
            ->chunkById(500, function ($rows) {
                $now = now();

                DB::table('service_invoice_payment_items')->insert(
                    collect($rows)->map(fn ($row) => [
                        'service_invoice_payment_id' => $row->id,
                        'service_invoice_id' => $row->service_invoice_id,
                        'amount' => $row->amount,
                        'admin_fee' => $row->admin_fee,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ])->all()
                );
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_invoice_payment_items');
    }
};
