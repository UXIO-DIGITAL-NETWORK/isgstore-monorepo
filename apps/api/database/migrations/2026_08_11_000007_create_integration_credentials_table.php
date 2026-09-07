<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * DB-backed, editable integration credentials (Monetapay, Digiflazz, …).
 *
 * `credentials` is an encrypted JSON blob (Laravel `encrypted:array` cast), so
 * secrets are ciphertext at rest — a DB dump never leaks the token/AES keys.
 * Values here OVERRIDE `config('services.*')`; an absent row (or absent key)
 * falls back to the existing `.env`, so nothing breaks until an admin edits.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integration_credentials', function (Blueprint $table) {
            $table->id();
            $table->string('provider')->unique(); // 'monetapay' | 'digiflazz'
            $table->boolean('is_active')->default(true);
            $table->string('mode')->nullable(); // e.g. production | sandbox (display only)
            $table->text('credentials')->nullable(); // encrypted:array
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integration_credentials');
    }
};
