<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One Monetapay payment attempt against a service invoice.
 *
 * A row per attempt rather than a set of columns on `service_invoices`,
 * because an invoice legitimately outlives its payment: a virtual account
 * expires after 600 seconds while `due_at` is three days out, so a client will
 * routinely need a second QR or VA for the same bill.
 *
 * If the reference lived on the invoice and were overwritten, a webhook that
 * arrived late for the superseded reference would match nothing — and
 * MonetapayCallbackController maps a lookup miss to a 500, which Monetapay
 * reads as "retry forever".
 *
 * Shaped after `balance_topups`, the other payable that shares the checkout
 * gateway without owning a `transactions` row.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_invoice_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payment_channel_id')->constrained()->restrictOnDelete();
            // Prefixed SRV- so the shared Monetapay callback can route to a
            // service bill without a lookup, the way TOP- routes a wallet
            // top-up and PAY- a product order.
            $table->string('reference_id')->unique();
            $table->string('pg_transaction_id')->nullable(); // Monetapay order_no
            // Frozen when the attempt opens: the catalogue price and the
            // channel's fee may both move before the client pays.
            $table->unsignedBigInteger('amount');
            $table->unsignedBigInteger('admin_fee')->default(0);
            $table->unsignedBigInteger('total');
            $table->enum('status', ['PENDING', 'PAID', 'EXPIRED'])->default('PENDING');
            // qr_string / virtual_account / redirect_url — persisted so a page
            // refresh still shows what to pay against.
            $table->json('payment_data')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            // "the live attempt for this invoice", and the expiry sweep.
            $table->index(['service_invoice_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_invoice_payments');
    }
};
