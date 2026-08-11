<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Kita's own money.
 *
 * `platform_accounts` is a tiny set of named balances (just "default" for now)
 * that PlatformLedger locks FOR UPDATE the same way WalletLedger locks a user
 * row — one place the balance is allowed to move. `platform_mutations` is the
 * append-only ledger behind it: every settlement records the markup kept
 * (admin_fee - gateway_fee) as a credit, so kita's saldo is auditable rather
 * than a number recomputed on demand.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->bigInteger('balance')->default(0);
            $table->timestamps();
        });

        Schema::create('platform_mutations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('platform_account_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            // Signed: summing the column reconciles against the account balance.
            $table->bigInteger('amount');
            $table->bigInteger('balance_before');
            $table->bigInteger('balance_after');
            $table->string('reference')->nullable()->index();
            $table->string('description')->nullable();
            $table->timestamps();

            $table->index(['platform_account_id', 'created_at']);
        });

        DB::table('platform_accounts')->insert([
            'code' => 'default',
            'balance' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_mutations');
        Schema::dropIfExists('platform_accounts');
    }
};
