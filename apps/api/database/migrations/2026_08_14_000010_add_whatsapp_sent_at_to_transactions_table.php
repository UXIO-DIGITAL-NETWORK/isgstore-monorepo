<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `whatsapp_sent_at` is the WhatsApp counterpart of `receipt_sent_at`: it
     * makes the PiWAPI receipt delivery idempotent across the three completion
     * paths, independently of the email so one channel can send without the
     * other.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->timestamp('whatsapp_sent_at')->nullable()->after('receipt_sent_at');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn('whatsapp_sent_at');
        });
    }
};
