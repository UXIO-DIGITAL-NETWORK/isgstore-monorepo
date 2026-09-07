<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained('transactions')->restrictOnDelete()->comment('1 Transaction = 1 Tagihan Pembayaran');
            $table->foreignId('payment_channel_id')->constrained('payment_channels')->restrictOnDelete();
            $table->string('reference_id')->unique()->comment('Dikirim ke Monetapay sbg mch_order_no');
            $table->string('pg_transaction_id')->nullable()->comment('order_no balikan dari Monetapay');
            $table->bigInteger('gross_amount')->comment('Total harga order + admin fee PG');
            $table->bigInteger('admin_fee')->comment('Biaya admin PG yang dibebankan (channel_fee + admin_markup)');
            $table->bigInteger('channel_fee')->default(0)->comment('Biaya Metode Pembayaran');
            $table->bigInteger('admin_markup')->default(0)->comment('Biaya Admin (markup kita)');
            // What Monetapay actually deducted; platform profit = admin_fee - gateway_fee.
            $table->bigInteger('gateway_fee')->default(0);
            $table->json('payment_data')->nullable()->comment('MYSQL JSON TYPE: {"virtual_account": "123", "deep_link": "ovo://"}');
            $table->string('status')->comment('1: pending, 2: expired, 3: success, 4: fail');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
