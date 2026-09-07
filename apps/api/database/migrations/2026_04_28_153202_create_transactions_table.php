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
            $table->enum('transaction_type', ['prepaid', 'postpaid'])
                ->default('prepaid')
                ->comment('prepaid = topup/voucher, postpaid = bill payment');

            $table->foreignId('user_id')->nullable()->constrained('users')->restrictOnDelete();
            // Merchant ("client") attribution for the payment page: a transaction
            // copies its product's owner at checkout. Nullable — legacy/platform rows stay null.
            $table->foreignId('merchant_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('payment_channel_id')->nullable()->constrained('payment_channels')->restrictOnDelete();
            // FK constraint added in create_promos migration (promos is created later).
            $table->foreignId('promo_id')->nullable();

            // Contact / delivery
            $table->string('guest_contact', 20)->nullable();
            $table->string('contact_email')->nullable();
            $table->string('locale', 5)->nullable();
            $table->timestamp('receipt_sent_at')->nullable();
            $table->timestamp('whatsapp_sent_at')->nullable();

            // Order data
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->restrictOnDelete();
            $table->string('target_uid')->nullable()->comment('Dikirim sebagai customer_no ke Digiflazz');
            $table->string('target_server')->nullable()->comment('Zone ID/Server ID Pemain');
            $table->string('target_nickname')->nullable()->comment('Nickname in-game hasil validasi saat checkout');

            // Amounts. amount_fee = channel_fee + admin_markup (kept as the combined total).
            $table->bigInteger('amount_base')->default(0)->comment('Harga jual internal / basic price');
            $table->bigInteger('amount_fee')->default(0)->comment('Payment Gateway fee (channel_fee + admin_markup)');
            $table->bigInteger('channel_fee')->default(0)->comment('Biaya Metode Pembayaran');
            $table->bigInteger('admin_markup')->default(0)->comment('Biaya Admin (markup kita)');
            $table->unsignedBigInteger('discount_amount')->default(0);
            $table->bigInteger('amount_total')->default(0)->comment('Total to be paid by user');

            // Old columns kept as requested
            $table->bigInteger('total_price')->default(0)->comment('Harga jual internal');
            $table->bigInteger('margin')->default(0)->comment('Keuntungan kotor transaksi');

            // Enum status
            $table->enum('status', ['PENDING', 'PAID', 'PROCESSING', 'COMPLETED', 'FAILED_PROVIDER', 'REFUNDED', 'EXPIRED'])->default('PENDING');

            $table->boolean('is_manual')->default(false);
            $table->string('sn')->nullable()->comment('Serial Number / Kode Voucher dari Digiflazz');
            $table->string('proof')->nullable()->comment('Manual admin proof-of-settlement upload');
            $table->string('supplier_trx_id')->nullable()->comment('trx_id balikan dari Digiflazz');
            $table->string('supplier_status')->nullable()->comment('Sukses, Gagal, Pending dari Digiflazz');
            $table->timestamps();

            $table->index('contact_email');
            // Composite (merchant_id, created_at) also satisfies the merchant_id FK index requirement.
            $table->index(['merchant_id', 'created_at'], 'transactions_merchant_date_idx');
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
