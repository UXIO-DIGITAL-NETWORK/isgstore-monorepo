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
        Schema::create('service_invoice_payment_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_invoice_payment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_invoice_id')->constrained()->cascadeOnDelete();
            // This bill's own amount — exact, never apportioned.
            $table->unsignedBigInteger('amount');
            // This bill's share of the one channel fee. Sums to the attempt's.
            $table->unsignedBigInteger('admin_fee')->default(0);
            $table->timestamps();

            $table->unique(['service_invoice_payment_id', 'service_invoice_id']);
            $table->index('service_invoice_id');
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
