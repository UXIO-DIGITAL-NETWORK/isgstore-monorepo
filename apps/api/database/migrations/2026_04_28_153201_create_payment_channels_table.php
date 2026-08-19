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
            // Plain string (not an enum) so a new payment type is a seeder change,
            // not a schema migration — and so the internal 'balance' wallet fits.
            $table->string('payment_type', 50);
            $table->string('channel_code')->unique();
            $table->string('name');
            $table->string('logo_path')->nullable();
            $table->string('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->bigInteger('min_amount')->default(0);
            $table->bigInteger('fee_flat')->default(0);
            $table->decimal('fee_percent', 5, 2)->default(0);
            // Payment-gateway cut; 0 for the internal wallet, 0.70% for real channels.
            $table->decimal('gateway_fee_percent', 5, 2)->default(0.70);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_single_use')->default(true);
            $table->json('extra_config')->nullable();
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
