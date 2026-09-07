<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Loyalty points become real.
 *
 * `users.point` and `point_histories` already existed but were a dead scaffold:
 * the admin CRUD wrote the history table without ever moving the balance
 * column, and nothing earned or spent a point. That table is left alone as
 * legacy — it has no `type` column and its writer does not touch the balance,
 * so retrofitting it would drag both faults forward.
 *
 * `point_ledger` mirrors `balance_mutations`, and `App\Support\Points\PointLedger`
 * mirrors `WalletLedger` line for line. The **unique (transaction_id, type)** is
 * the exactly-once guarantee — not the pre-check in the granting action, which
 * is only the fast path. Same reasoning as the unique `refund_requests.transaction_id`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('point_ledger', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            // Null for an admin adjustment, which has no order behind it.
            $table->foreignId('transaction_id')->nullable()->constrained('transactions')->nullOnDelete();

            $table->string('type', 24)
                ->comment('earn | spend | refund_return | earn_reversal | admin_adjust');

            // Signed: positive credits, negative debits. Same shape as
            // balance_mutations.amount, for the same reason — a statement that
            // cannot show money leaving is not a statement.
            $table->integer('amount');
            $table->integer('points_before');
            $table->integer('points_after');

            $table->string('reference')->nullable()->index();
            $table->string('description')->nullable();

            $table->timestamps();

            // The exactly-once key. A transaction can be saved many times and
            // reach COMPLETED from four different places; this is what makes
            // "granted already" a database fact rather than a race.
            $table->unique(['transaction_id', 'type']);
            $table->index(['user_id', 'created_at']);
        });

        Schema::table('products', function (Blueprint $table) {
            // Per-product earning, either shape. Null falls back to the global
            // setting, so a new product earns points without anyone remembering
            // to configure it.
            $table->decimal('point_percent', 6, 2)->nullable()->after('price_max');
            $table->unsignedInteger('point_flat')->nullable()->after('point_percent');
        });

        Schema::table('transactions', function (Blueprint $table) {
            // What the customer redeemed, and what it was worth in rupiah.
            // Both are stored: the rate is 1:1 today, and keeping only points
            // would corrupt history the day it is not.
            $table->unsignedInteger('points_spent')->default(0)->after('discount_amount');
            $table->unsignedBigInteger('points_spent_amount')->default(0)->after('points_spent');
            // Denormalised for the receipt and the admin row.
            $table->unsignedInteger('points_earned')->default(0)->after('points_spent_amount');
        });

        Schema::table('refund_requests', function (Blueprint $table) {
            // Points come back as points; only the rupiah remainder is cash.
            $table->unsignedInteger('points_amount')->default(0)->after('amount');
        });
    }

    public function down(): void
    {
        Schema::table('refund_requests', fn (Blueprint $table) => $table->dropColumn('points_amount'));
        Schema::table('transactions', fn (Blueprint $table) => $table->dropColumn(['points_spent', 'points_spent_amount', 'points_earned']));
        Schema::table('products', fn (Blueprint $table) => $table->dropColumn(['point_percent', 'point_flat']));
        Schema::dropIfExists('point_ledger');
    }
};
