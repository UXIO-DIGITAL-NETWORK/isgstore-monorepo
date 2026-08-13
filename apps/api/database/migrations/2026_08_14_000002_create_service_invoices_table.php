<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A client's bill for one period of one service.
 *
 * Payment is manual: the invoice is issued UNPAID, the client transfers and
 * uploads a bukti transfer (WAITING_CONFIRMATION), kita verifies (PAID) and
 * only then does a `service_subscriptions` row come into existence. Nothing
 * here touches WalletLedger or PlatformLedger — the money arrives by bank
 * transfer into an account those ledgers do not model.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_invoices', function (Blueprint $table) {
            $table->id();
            // 'SINV-' prefix so a service bill can never collide with the
            // 'INV-' of a consumer checkout receipt.
            $table->string('invoice_number')->unique();
            $table->foreignId('merchant_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            // Snapshots. The catalogue price and duration will change; an
            // issued invoice must keep what was agreed, exactly as a
            // Transaction snapshots amount_base.
            $table->string('service_name');
            $table->unsignedBigInteger('amount');
            $table->unsignedInteger('duration_days');
            $table->string('status')->default('UNPAID')->index(); // App\Enums\ServiceInvoiceStatus
            // Drives the nightly UNPAID sweep and the "jatuh tempo" column.
            $table->timestamp('due_at')->nullable();
            $table->string('proof_path')->nullable(); // public disk, like withdrawals.proof_path
            $table->timestamp('proof_uploaded_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            // The client's note on submit, or kita's reason on rejection.
            $table->string('notes')->nullable();
            $table->timestamps();

            // "My purchase history", and kita's verification queue filter.
            $table->index(['merchant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_invoices');
    }
};
