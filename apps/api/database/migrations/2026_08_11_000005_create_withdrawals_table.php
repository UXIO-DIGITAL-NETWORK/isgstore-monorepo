<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Merchant withdrawal requests.
 *
 * A client requests a payout from its wallet balance; the funds are held (the
 * balance is debited when the request is created) so a merchant cannot request
 * more than it holds. Kita then approves (disbursed via Monetapay, status ends
 * SETTLED) or rejects (the held amount is credited back). `fee` is kita's
 * withdraw markup; `nett` = amount - fee is what actually reaches the merchant.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('withdrawals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->constrained('users')->cascadeOnDelete();
            $table->string('withdrawal_number')->unique();
            $table->bigInteger('amount');
            $table->bigInteger('fee')->default(0);
            $table->bigInteger('nett');
            $table->string('bank_code');
            // Nullable: e-wallet payouts are keyed on the phone, not an account number.
            $table->string('account_number')->nullable();
            $table->string('account_name');
            // Beneficiary phone — the wallet id for e-wallet payouts, and the
            // disbursement account_phone for bank payouts.
            $table->string('account_phone')->nullable();
            $table->string('status')->default('PENDING')->index();
            $table->string('notes')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->string('disbursement_ref')->nullable();
            // Bukti transfer for a manually-settled payout (public disk path).
            $table->string('proof_path')->nullable();
            $table->json('payout_data')->nullable();
            $table->timestamps();

            $table->index(['merchant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('withdrawals');
    }
};
