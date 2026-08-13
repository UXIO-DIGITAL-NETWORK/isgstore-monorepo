<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The catalogue of supporting services kita sells to its payment-page clients:
 * Digiflazz, Monetapay, an email gateway, a domain, the WhatsApp API.
 *
 * Distinct from `products` (the game top-up catalogue sold to consumers) and
 * from `membership_plans` (a consumer loyalty tier). Priced per period; a
 * client buys one period at a time via a `service_invoices` row.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            // Stable key seeders and integrations reference instead of the id,
            // so a re-seed cannot repoint a subscription at the wrong service.
            $table->string('code')->unique();
            $table->string('name');
            $table->string('category')->default('other')->index(); // App\Enums\ServiceCategory
            $table->text('description')->nullable();
            $table->json('features')->nullable(); // Bullet list on the client's catalogue card.
            // Rupiah for ONE period. Integer like membership_plans.price —
            // there is no float money anywhere in this codebase.
            $table->unsignedBigInteger('price');
            $table->unsignedInteger('duration_days');
            // Lets a service inherit its channel's live on/off flag on the
            // status page. Null for services with no payment channel behind
            // them (email, domain), whose baseline is `is_active` alone.
            $table->foreignId('payment_channel_id')->nullable()->constrained()->nullOnDelete();
            // Hidden from the client catalogue when false. Existing
            // subscriptions are unaffected — they run to their ends_at.
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'sort_order']); // The client catalogue query, exactly.
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
