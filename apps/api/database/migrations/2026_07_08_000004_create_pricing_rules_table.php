<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pricing_rules', function (Blueprint $table) {
            $table->id();
            // NULL category_id = global fallback rule for the role.
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('role'); // member | vip | reseller | agent
            $table->decimal('markup_percent', 6, 2)->default(0);
            $table->bigInteger('markup_flat')->default(0);
            $table->timestamps();

            $table->unique(['category_id', 'role']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pricing_rules');
    }
};
