<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Site settings as key/value rows rather than a wide table: the field list is
 * not knowable up front, and every new setting would otherwise be a migration.
 *
 * `is_public` is the gate for the storefront's settings endpoint. Defaulting
 * it to false means a newly added key is private until someone decides
 * otherwise — the failure mode of forgetting the flag is an absent value on
 * the site, not a secret in a JS bundle.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('group')->default('general')->index();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->enum('type', ['string', 'text', 'number', 'boolean', 'json', 'image'])->default('string');
            $table->string('label')->nullable();
            $table->boolean('is_public')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
