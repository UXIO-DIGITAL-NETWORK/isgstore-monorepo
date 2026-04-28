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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique()->comment('Format: INV-20260428-XXXX. Ref ID Digiflazz');
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->restrictOnDelete();
            $table->string('target_uid')->nullable()->comment('Dikirim sebagai customer_no ke Digiflazz');
            $table->string('target_server')->nullable()->comment('Zone ID/Server ID Pemain');
            $table->bigInteger('total_price')->comment('Harga jual internal');
            $table->bigInteger('margin')->comment('Keuntungan kotor transaksi');
            $table->string('status')->comment('Pending, Processing, Success, Failed');
            $table->boolean('is_manual')->default(false);
            $table->string('sn')->nullable()->comment('Serial Number / Kode Voucher dari Digiflazz');
            $table->string('supplier_trx_id')->nullable()->comment('trx_id balikan dari Digiflazz');
            $table->string('supplier_status')->nullable()->comment('Sukses, Gagal, Pending dari Digiflazz');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
