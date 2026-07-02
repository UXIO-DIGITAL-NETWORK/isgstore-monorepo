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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique()->comment('Format: INV-20260428-XXXX. Ref ID Digiflazz');
            $table->foreignId('user_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->foreignId('payment_channel_id')->nullable()->constrained('payment_channels')->restrictOnDelete();
            
            // Existing order data columns
            $table->string('guest_contact', 20)->nullable();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->restrictOnDelete();
            $table->string('target_uid')->nullable()->comment('Dikirim sebagai customer_no ke Digiflazz');
            $table->string('target_server')->nullable()->comment('Zone ID/Server ID Pemain');
            
            // Amounts
            $table->bigInteger('amount_base')->default(0)->comment('Harga jual internal / basic price');
            $table->bigInteger('amount_fee')->default(0)->comment('Payment Gateway fee');
            $table->bigInteger('amount_total')->default(0)->comment('Total to be paid by user');
            
            // Old columns kept as requested
            $table->bigInteger('total_price')->default(0)->comment('Harga jual internal');
            $table->bigInteger('margin')->default(0)->comment('Keuntungan kotor transaksi');
            
            // Enum status
            $table->enum('status', ['PENDING', 'PAID', 'PROCESSING', 'COMPLETED', 'FAILED_PROVIDER', 'REFUNDED'])->default('PENDING');
            
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
        Schema::dropIfExists('transactions');
    }
};
