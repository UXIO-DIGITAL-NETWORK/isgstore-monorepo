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
        Schema::create('payment_channels', function (Blueprint $table) {
            $table->id();
            $table->enum('payment_type', ['virtual_account', 'qris', 'ewallet', 'convenience_store']);
            $table->string('channel_code')->unique();
            $table->string('name');
            $table->bigInteger('min_amount')->default(0);
            $table->bigInteger('fee_flat')->default(0);
            $table->decimal('fee_percent', 5, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_channels');
    }
};
