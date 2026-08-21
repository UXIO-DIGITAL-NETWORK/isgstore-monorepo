<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Point-in-time snapshots for reconciling kita's books against Monetapay's real
 * balance (Direct Deduction model).
 *
 * The absolute balance can't be reconciled directly — its opening baseline and
 * any manual top-ups to the Monetapay account are invisible to our DB. So we
 * reconcile the DELTA between two runs: `reported_balance` is what Monetapay
 * says now; `expected_balance` is the previous snapshot's reported balance
 * plus the net movement our own ledger predicts (collections net of gateway
 * fee, minus payouts + disbursement fee, minus refunds). A gap beyond tolerance
 * means our fee config or the contract rate drifted — the whole point of the check.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gateway_balance_snapshots', function (Blueprint $table) {
            $table->id();
            $table->timestamp('captured_at')->index();
            // What Monetapay's balance inquiry reported at capture time.
            $table->bigInteger('reported_balance');
            // Prev snapshot's reported balance + the net movement our books predict.
            $table->bigInteger('expected_balance');
            // reported_balance - expected_balance. Non-zero beyond tolerance = drift.
            $table->bigInteger('delta');
            // Window bounds + the component sums that fed `expected_balance`, so a
            // reviewer can see how the number was built without re-running.
            $table->json('meta')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gateway_balance_snapshots');
    }
};
