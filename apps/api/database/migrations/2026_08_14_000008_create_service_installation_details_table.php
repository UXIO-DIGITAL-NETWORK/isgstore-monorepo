<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The data kita hands the client at the end of an installation: usernames,
 * endpoints, API keys.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_installation_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_installation_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            // TEXT, not string. Laravel's `encrypted` cast base64s a JSON envelope
            // (iv + mac + value) — roughly 1.4x the plaintext plus ~200 bytes — so
            // a 255-char API key overflows VARCHAR(255) once encrypted and is
            // truncated silently under a non-strict MySQL mode.
            //
            // Encrypted for EVERY row, not only the secret ones: one code path
            // means there is no branch in which a value is written in the clear.
            $table->text('value');
            // Drives masking in the UI. It is NOT what makes the column
            // encrypted — that distinction matters if a row is ever flipped
            // from secret to not-secret.
            $table->boolean('is_secret')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            // No index on `value`, ever: the ciphertext is non-deterministic, so
            // it cannot be searched, sorted, or uniquely constrained anyway.
            // Named explicitly — the generated name exceeds MySQL's 64-char cap.
            $table->index(['service_installation_id', 'sort_order'], 'installation_details_order_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_installation_details');
    }
};
