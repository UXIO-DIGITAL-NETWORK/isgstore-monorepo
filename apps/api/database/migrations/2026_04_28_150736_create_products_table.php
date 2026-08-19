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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            // Merchant ("client") that sells this product. Nullable — platform-owned catalogue stays null.
            $table->foreignId('merchant_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->foreignId('sub_category_id')->nullable()->constrained('sub_categories')->nullOnDelete();
            $table->string('name');
            $table->string('sub_name')->nullable();
            $table->string('code')->unique();
            $table->string('logo')->nullable();
            $table->text('description')->nullable();
            $table->string('validasi_nickname')->nullable();
            $table->string('access')->nullable();
            $table->string('tag')->nullable();
            $table->bigInteger('price_modal');
            $table->bigInteger('price_member');
            $table->bigInteger('price_vip');
            $table->bigInteger('price_reseller');
            $table->bigInteger('price_agent');
            // status = lifecycle (retired?), is_available = storefront visibility right now.
            $table->boolean('status')->default(true);
            $table->boolean('is_available')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
