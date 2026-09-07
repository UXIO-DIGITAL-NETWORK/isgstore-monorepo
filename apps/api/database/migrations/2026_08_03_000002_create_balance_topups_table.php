<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wallet top-ups and the ledger behind `users.balance`.
 *
 * Spending the wallet already works — `CheckoutAction` deducts under a row
 * lock and `RefundFailedTransactionAction` restores. What was missing was any
 * way to add to it.
 *
 * `balance_mutations` is an append-only ledger recording `balance_before` and
 * `balance_after` on every movement. Without it `users.balance` is a number
 * nobody can audit: a discrepancy would be undiagnosable, which is not an
 * acceptable property for money.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('balance_topups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payment_channel_id')->constrained()->restrictOnDelete();
            // Prefixed TOP- so the shared Monetapay callback can tell a wallet
            // top-up from a product order without a lookup.
            $table->string('reference_id')->unique();
            $table->unsignedBigInteger('amount');
            $table->unsignedBigInteger('admin_fee')->default(0);
            $table->unsignedBigInteger('total');
            $table->enum('status', ['PENDING', 'PAID', 'EXPIRED', 'FAILED'])->default('PENDING')->index();
            $table->json('payment_data')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::create('balance_mutations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // Plain string (not an enum) so new movement types — settlement,
            // withdrawal — don't need a migration each time.
            $table->string('type');
            // Signed: a debit is negative, so summing the column reconciles
            // against users.balance directly.
            $table->bigInteger('amount');
            $table->unsignedBigInteger('balance_before');
            $table->unsignedBigInteger('balance_after');
            $table->string('reference')->nullable()->index();
            $table->string('description')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('balance_mutations');
        Schema::dropIfExists('balance_topups');
    }
};
