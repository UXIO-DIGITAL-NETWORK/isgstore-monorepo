<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The buyer's email captured at checkout (for guests and members alike):
     * it is where the purchase receipt is sent and a key the order tracker can
     * match on. `locale` remembers the language chosen at checkout so the
     * receipt email is in the buyer's language; `receipt_sent_at` makes the
     * send idempotent across the three completion paths.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('contact_email')->nullable()->after('guest_contact');
            $table->string('locale', 5)->nullable()->after('contact_email');
            $table->timestamp('receipt_sent_at')->nullable()->after('locale');
            $table->index('contact_email');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['contact_email']);
            $table->dropColumn(['contact_email', 'locale', 'receipt_sent_at']);
        });
    }
};
