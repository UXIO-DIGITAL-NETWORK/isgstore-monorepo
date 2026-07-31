<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Member API credentials for the integration page.
 *
 * Only a hash is stored. `key_prefix` is the readable head kept for display
 * ("sk_live_udn_4a8b…"), so the list can identify a key without holding the
 * secret. This means a key can be shown exactly once, at creation — see the
 * note in the integration UI.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_api_credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name')->default('Default');
            $table->string('key_prefix', 24)->index();
            $table->string('key_hash');
            $table->string('callback_url')->nullable();
            $table->json('whitelist_ips')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_api_credentials');
    }
};
